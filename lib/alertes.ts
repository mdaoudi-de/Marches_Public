/**
 * Moteur d'alertes — matérialise les alertes métier dans la table `Alert`.
 * Idempotent : dédoublonnage par (type, refEntity). Préserve l'état ACQUITTEE.
 * Auto-résolution : une alerte ACTIVE dont la condition a disparu passe à RESOLUE.
 */
import { addDays, differenceInCalendarDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { today, ALERT_HORIZON_DAYS } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { GUARANTEE_TYPE_LABELS, label } from "@/lib/enums";

interface CandidateAlert {
  type: string;
  refEntity: string;
  severity: string;
  message: string;
  marketId?: number | null;
  contractId?: number | null;
  dueDate?: Date | null;
}

export interface AlertRecomputeSummary {
  created: number;
  updated: number;
  resolved: number;
  active: number;
}

export async function recomputeAlerts(): Promise<AlertRecomputeSummary> {
  const now = today();
  const horizon = addDays(now, ALERT_HORIZON_DAYS);
  const candidates: CandidateAlert[] = [];

  /* 1. Étapes échues non réalisées → ETAPE_EN_RETARD / RETARD_PUBLICATION */
  const lateSteps = await prisma.marketStep.findMany({
    where: { actualDate: null, plannedDate: { lt: now }, stepKind: "DATE" },
    include: { market: { select: { id: true, reference: true } } },
  });
  for (const s of lateSteps) {
    const daysLate = differenceInCalendarDays(now, s.plannedDate!);
    const isPub = /publication|avis/i.test(s.stepName);
    candidates.push({
      type: isPub ? "RETARD_PUBLICATION" : "ETAPE_EN_RETARD",
      refEntity: `MarketStep:${s.id}`,
      severity: daysLate > 15 ? "CRITIQUE" : "WARNING",
      message: `${s.market.reference} — « ${s.stepName} » en retard de ${daysLate} j (prévue le ${formatDate(s.plannedDate)}).`,
      marketId: s.marketId,
      dueDate: s.plannedDate,
    });
  }

  /* 2. Garanties arrivant à expiration (≤ 30 j ou déjà expirées) */
  const guarantees = await prisma.guarantee.findMany({
    where: { status: "ACTIVE", expiryDate: { lte: horizon } },
    include: { contract: { include: { market: { select: { id: true, reference: true } } } } },
  });
  for (const g of guarantees) {
    const expired = g.expiryDate! < now;
    candidates.push({
      type: "GARANTIE_EXPIRATION",
      refEntity: `Guarantee:${g.id}`,
      severity: expired ? "CRITIQUE" : "WARNING",
      message: `${g.contract.market.reference} — ${label(GUARANTEE_TYPE_LABELS, g.type)} ${expired ? "expirée" : "expire"} le ${formatDate(g.expiryDate)}.`,
      marketId: g.contract.market.id,
      contractId: g.contractId,
      dueDate: g.expiryDate,
    });
  }

  /* 3. Contrats dont l'échéance approche (≤ 30 j) */
  const contracts = await prisma.contract.findMany({
    where: { status: "ACTIF", endDate: { lte: horizon } },
    include: { market: { select: { id: true, reference: true } } },
  });
  for (const c of contracts) {
    const over = c.endDate! < now;
    candidates.push({
      type: "ECHEANCE_CONTRAT",
      refEntity: `Contract:${c.id}`,
      severity: over ? "CRITIQUE" : "WARNING",
      message: `${c.market.reference} — contrat ${c.reference} ${over ? "arrivé à échéance" : "arrive à échéance"} le ${formatDate(c.endDate)}.`,
      marketId: c.market.id,
      contractId: c.id,
      dueDate: c.endDate,
    });
  }

  /* 4. Livraisons/réceptions en retard */
  const receptions = await prisma.reception.findMany({
    where: { actualDate: null, plannedDate: { lt: now } },
    include: { contract: { include: { market: { select: { id: true, reference: true } } } } },
  });
  for (const r of receptions) {
    const daysLate = differenceInCalendarDays(now, r.plannedDate!);
    candidates.push({
      type: "RETARD_LIVRAISON",
      refEntity: `Reception:${r.id}`,
      severity: daysLate > 30 ? "CRITIQUE" : "WARNING",
      message: `${r.contract.market.reference} — livraison/réception en retard de ${daysLate} j (prévue le ${formatDate(r.plannedDate)}).`,
      marketId: r.contract.market.id,
      contractId: r.contractId,
      dueDate: r.plannedDate,
    });
  }

  /* 5. Paiements échus non réglés */
  const payments = await prisma.payment.findMany({
    where: { status: { not: "PAYE" }, dueDate: { lt: now } },
    include: { contract: { include: { market: { select: { id: true, reference: true } } } } },
  });
  for (const p of payments) {
    const daysLate = differenceInCalendarDays(now, p.dueDate!);
    candidates.push({
      type: "PAIEMENT_ATTENTE",
      refEntity: `Payment:${p.id}`,
      severity: daysLate > 30 ? "CRITIQUE" : "WARNING",
      message: `${p.contract.market.reference} — paiement ${p.reference} en attente depuis ${daysLate} j (échéance ${formatDate(p.dueDate)}).`,
      marketId: p.contract.market.id,
      contractId: p.contractId,
      dueDate: p.dueDate,
    });
  }

  /* Upsert idempotent */
  let created = 0;
  let updated = 0;
  for (const c of candidates) {
    const existing = await prisma.alert.findUnique({
      where: { type_refEntity: { type: c.type, refEntity: c.refEntity } },
    });
    if (existing) {
      await prisma.alert.update({
        where: { id: existing.id },
        data: { severity: c.severity, message: c.message, dueDate: c.dueDate ?? null },
      });
      updated++;
    } else {
      await prisma.alert.create({
        data: {
          type: c.type,
          refEntity: c.refEntity,
          severity: c.severity,
          message: c.message,
          marketId: c.marketId ?? null,
          contractId: c.contractId ?? null,
          dueDate: c.dueDate ?? null,
          status: "ACTIVE",
          createdAt: now,
        },
      });
      created++;
    }
  }

  /* Auto-résolution des alertes ACTIVE devenues caduques */
  const currentKeys = new Set(candidates.map((c) => `${c.type}::${c.refEntity}`));
  const actives = await prisma.alert.findMany({ where: { status: "ACTIVE" } });
  let resolved = 0;
  for (const a of actives) {
    const key = `${a.type}::${a.refEntity ?? ""}`;
    if (!currentKeys.has(key)) {
      await prisma.alert.update({ where: { id: a.id }, data: { status: "RESOLUE", resolvedAt: now } });
      resolved++;
    }
  }

  const active = await prisma.alert.count({ where: { status: "ACTIVE" } });
  return { created, updated, resolved, active };
}
