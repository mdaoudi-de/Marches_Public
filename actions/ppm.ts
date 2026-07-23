"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

function parseDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Crée un marché à partir d'un template et instancie ses étapes (prévisions cascadées). */
export async function createMarket(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "edit");

  const intitule = String(formData.get("intitule") ?? "").trim();
  const templateId = Number(formData.get("templateId"));
  const budget = Number(formData.get("budgetAmountFC") ?? 0);
  const budgetCode = String(formData.get("budgetCode") ?? "").trim() || null;
  const aoNumber = String(formData.get("aoNumber") ?? "").trim() || null;
  const fiscalYear = Number(formData.get("fiscalYear") ?? 2026);
  const directionId = formData.get("directionId") ? Number(formData.get("directionId")) : null;
  const start = parseDate(formData.get("startDate")) ?? new Date("2026-07-15T00:00:00.000Z");

  if (!intitule || !templateId || !budget) {
    throw new Error("Intitulé, template et montant du budget sont requis.");
  }

  const template = await prisma.procedureTemplate.findUniqueOrThrow({
    where: { id: templateId },
    include: { phases: { orderBy: { order: "asc" }, include: { steps: { orderBy: { order: "asc" } } } } },
  });

  // Référence auto : <PREFIXE>-<ANNEE>-<NNN>
  const prefix = template.marketNature === "TRAVAUX" ? "T" : template.marketNature === "FOURNITURES_SERVICES" ? "F" : "P";
  const count = await prisma.market.count({ where: { nature: template.marketNature } });
  const reference = `${prefix}-${fiscalYear}-${String(count + 1).padStart(3, "0")}`;

  // Instanciation des étapes avec prévisions en cascade.
  let running = start;
  let order = 0;
  const stepsData: {
    phaseName: string; stepName: string; order: number; stepKind: string;
    plannedDate: Date | null; plannedAmountFC: number | null;
  }[] = [];
  for (const ph of template.phases) {
    for (const st of ph.steps) {
      order++;
      if (st.stepKind === "MONTANT") {
        stepsData.push({ phaseName: ph.name, stepName: st.name, order, stepKind: "MONTANT", plannedDate: null, plannedAmountFC: budget });
      } else {
        running = addDays(running, st.defaultDelayDays ?? 10);
        stepsData.push({ phaseName: ph.name, stepName: st.name, order, stepKind: "DATE", plannedDate: new Date(running), plannedAmountFC: null });
      }
    }
  }

  const market = await prisma.market.create({
    data: {
      reference,
      intitule,
      nature: template.marketNature,
      procedureType: template.procedureType,
      budgetAmountFC: budget,
      budgetCode,
      aoNumber,
      fiscalYear,
      status: "PREVU",
      directionId,
      templateId: template.id,
      createdById: user.id,
      steps: { create: stepsData },
    },
  });

  await logAudit({ userId: user.id, action: "CREATE", module: "PPM", entityType: "Market", entityId: market.id, detail: `Création du marché ${reference} — ${intitule}` });
  revalidatePath("/ppm");
  redirect(`/ppm/${market.id}`);
}

async function loadStep(stepId: number) {
  return prisma.marketStep.findUniqueOrThrow({ where: { id: stepId }, include: { market: true } });
}

/** Enregistre la date réalisée d'une étape (+ historisation). */
export async function recordStepActual(stepId: number, value: string): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "edit");
  const step = await loadStep(stepId);
  const actualDate = value ? new Date(value + "T00:00:00.000Z") : null;

  await prisma.marketStep.update({
    where: { id: stepId },
    data: { actualDate, status: actualDate ? "REALISE" : "A_VENIR" },
  });
  await prisma.marketStepHistory.create({
    data: {
      marketStepId: stepId, userId: user.id, changeType: "UPDATE_ACTUAL", field: "actualDate",
      oldValue: step.actualDate ? step.actualDate.toISOString().slice(0, 10) : null,
      newValue: actualDate ? actualDate.toISOString().slice(0, 10) : "(effacé)",
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "PPM", entityType: "MarketStep", entityId: stepId, detail: `Réalisation « ${step.stepName} » (${step.market.reference})` });
  revalidatePath(`/ppm/${step.marketId}`);
  revalidatePath(`/passation/${step.marketId}`);
}

/** Met à jour la date prévisionnelle d'une étape. */
export async function recordStepPlanned(stepId: number, value: string): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "edit");
  const step = await loadStep(stepId);
  const plannedDate = value ? new Date(value + "T00:00:00.000Z") : null;
  await prisma.marketStep.update({ where: { id: stepId }, data: { plannedDate } });
  await prisma.marketStepHistory.create({
    data: {
      marketStepId: stepId, userId: user.id, changeType: "UPDATE_PLANNED", field: "plannedDate",
      oldValue: step.plannedDate ? step.plannedDate.toISOString().slice(0, 10) : null,
      newValue: plannedDate ? plannedDate.toISOString().slice(0, 10) : "(effacé)",
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "PPM", entityType: "MarketStep", entityId: stepId, detail: `Prévision « ${step.stepName} » (${step.market.reference})` });
  revalidatePath(`/ppm/${step.marketId}`);
}

/** Met à jour un montant prévu/réalisé (étape MONTANT). */
export async function recordStepAmount(stepId: number, planned: string, actual: string): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "edit");
  const step = await loadStep(stepId);
  const plannedAmountFC = planned ? Number(planned) : null;
  const actualAmountFC = actual ? Number(actual) : null;
  await prisma.marketStep.update({
    where: { id: stepId },
    data: { plannedAmountFC, actualAmountFC, status: actualAmountFC != null ? "REALISE" : "A_VENIR" },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "PPM", entityType: "MarketStep", entityId: stepId, detail: `Montant « ${step.stepName} » (${step.market.reference})` });
  revalidatePath(`/ppm/${step.marketId}`);
}

/** Valide une étape (réservé aux validateurs). */
export async function validateStep(stepId: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "validate");
  const step = await loadStep(stepId);
  await prisma.marketStep.update({ where: { id: stepId }, data: { validatedById: user.id, validatedAt: new Date() } });
  await prisma.marketStepHistory.create({
    data: { marketStepId: stepId, userId: user.id, changeType: "VALIDATE", field: "validatedAt", newValue: new Date().toISOString().slice(0, 10) },
  });
  await logAudit({ userId: user.id, action: "VALIDATE", module: "PPM", entityType: "MarketStep", entityId: stepId, detail: `Validation « ${step.stepName} » (${step.market.reference})` });
  revalidatePath(`/ppm/${step.marketId}`);
  revalidatePath(`/passation/${step.marketId}`);
}

/** Change le statut d'exécution du marché. */
export async function updateMarketStatus(marketId: number, status: string): Promise<void> {
  const user = await requireUser();
  assertCan(user, "PPM", "edit");
  await prisma.market.update({ where: { id: marketId }, data: { status } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "PPM", entityType: "Market", entityId: marketId, detail: `Statut → ${status}` });
  revalidatePath(`/ppm/${marketId}`);
  revalidatePath("/ppm");
}
