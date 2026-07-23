/**
 * Scoring persistant des tiers (Module 8.6) — partagé entre les Server Actions
 * (`actions/tiers.ts`) et le seed. Non « use server » afin d'être importable partout.
 */
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { computeRiskScore, type RiskInput } from "@/lib/scoring";
import { recomputeAlerts } from "@/lib/alertes";
import { today } from "@/lib/config";
import { CONTROL_ORDER, TP_DOC_ORDER, type DueDiligenceQuestion, type InternalControlKey } from "@/lib/enums";

const AUTO_CONTROLS: InternalControlKey[] = ["C1", "C3", "C4"];

export async function buildRiskInput(profileId: number): Promise<RiskInput> {
  const p = await prisma.thirdPartyProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      representatives: true, shareholders: true, documents: true, answers: true,
      investigations: true, controls: true, events: true,
      supplier: {
        include: {
          markets: { select: { nature: true, status: true } },
          contracts: { select: { status: true, penalties: { select: { id: true } }, receptions: { select: { actualDate: true, plannedDate: true } } } },
          evaluations: { select: { globalScore: true, conformityScore: true } },
        },
      },
    },
  });

  const docOK = (t: string) => p.documents.find((d) => d.docType === t)?.controlStatus === "OK";
  const ans = (q: DueDiligenceQuestion) => p.answers.find((a) => a.questionKey === q)?.answer;
  const now = today();

  const ok = p.documents.filter((d) => d.controlStatus === "OK").length;
  const expired = p.documents.filter((d) => d.controlStatus === "EXPIRE").length;
  const incoherent = p.documents.filter((d) => ["INCOHERENT", "FORMAT_INVALIDE", "DOUBLON"].includes(d.controlStatus)).length;
  const missing = p.documents.filter((d) => d.controlStatus === "MANQUANT").length + Math.max(0, TP_DOC_ORDER.length - p.documents.length);
  const total = TP_DOC_ORDER.length;

  const markets = p.supplier?.markets ?? [];
  const contracts = p.supplier?.contracts ?? [];
  const evals = p.supplier?.evaluations ?? [];
  const awarded = markets.filter((m) => ["ATTRIBUE", "EXECUTE", "CLOTURE", "RESILIE"].includes(m.status));
  const natureCounts: Record<string, number> = {};
  for (const m of awarded) natureCounts[m.nature] = (natureCounts[m.nature] ?? 0) + 1;
  const recurrence = Object.values(natureCounts).some((n) => n >= 2);
  const avgEval5 = evals.length ? evals.reduce((s, e) => s + e.globalScore, 0) / evals.length : null;
  const avgConf5 = evals.length ? evals.reduce((s, e) => s + e.conformityScore, 0) / evals.length : null;

  const manual = (k: InternalControlKey) => p.controls.find((c) => c.controlKey === k)?.triggered ?? false;
  const controls: Record<InternalControlKey, boolean> = {
    C1: recurrence,
    C3: recurrence && avgEval5 != null && avgEval5 < 1.25,
    C4: avgConf5 != null && avgConf5 < 3,
    C2: manual("C2"), C5: manual("C5"), C7: manual("C7"), C8: manual("C8"),
  };

  return {
    identity: { rccm: !!p.rccm, idNational: !!p.idNational, nif: !!p.nif, taxNumber: !!p.taxNumber, address: !!p.address, creationDate: !!p.creationDate },
    docs: { total, ok, expired, missing, incoherent },
    fiscal: { attestationFiscaleValid: docOK("ATTESTATION_FISCALE"), cnssValid: docOK("ATTESTATION_CNSS") },
    admin: { agrementsValid: docOK("AGREMENT"), licencesValid: docOK("LICENCE") },
    governance: {
      hasReps: p.representatives.length > 0,
      shareSumPct: Math.round(p.shareholders.reduce((s, sh) => s + sh.sharePct, 0)),
      beneficialOwnersIdentified: p.shareholders.some((sh) => sh.isBeneficialOwner),
    },
    reputation: {
      sanctions: p.events.filter((e) => !e.resolved && e.type === "NOUVELLE_SANCTION").length,
      contentieux: p.events.filter((e) => !e.resolved && e.type === "DECISION_JUDICIAIRE").length,
      mediasNegatifs: p.investigations.some((i) => i.itemKey === "MEDIAS" && i.result === "ANOMALIE") ? 1 : 0,
      condamnation: ans("CONDAMNATION") === "OUI",
      procedureJudiciaire: ans("PROCEDURE_JUDICIAIRE") === "OUI",
    },
    history: {
      nbResiliations: markets.filter((m) => m.status === "RESILIE").length + contracts.filter((c) => c.status === "RESILIE").length,
      nbPenalties: contracts.reduce((s, c) => s + c.penalties.length, 0),
      nbLateReceptions: contracts.reduce((s, c) => s + c.receptions.filter((r) => !r.actualDate && r.plannedDate && r.plannedDate < now).length, 0),
      avgEval5,
    },
    integrity: {
      anticorruption: ans("ANTICORRUPTION") === "OUI",
      exclusionMP: ans("EXCLUSION_MP") === "OUI",
      liensAgentsPublics: ans("LIENS_AGENTS_PUBLICS") === "OUI",
      lbcft: ans("LBC_FT") === "OUI",
    },
    controls,
  };
}

/** Calcule et persiste le score + rubriques + contrôles d'un tiers. */
export async function runScoring(profileId: number, opts?: { skipAlerts?: boolean }) {
  const input = await buildRiskInput(profileId);
  const result = computeRiskScore(input);

  for (const r of result.rubrics) {
    await prisma.thirdPartyRiskRubric.upsert({
      where: { profileId_rubricKey: { profileId, rubricKey: r.key } },
      create: { profileId, rubricKey: r.key, weightPct: r.weight, riskScore: r.risk, justification: r.justification },
      update: { weightPct: r.weight, riskScore: r.risk, justification: r.justification },
    });
  }
  for (const k of CONTROL_ORDER) {
    const triggered = input.controls[k];
    const computed = AUTO_CONTROLS.includes(k);
    await prisma.internalControlFlag.upsert({
      where: { profileId_controlKey: { profileId, controlKey: k } },
      create: { profileId, controlKey: k, triggered, computed, severity: triggered ? "WARNING" : "INFO" },
      update: computed ? { triggered, severity: triggered ? "WARNING" : "INFO" } : {},
    });
  }
  const now = today();
  await prisma.thirdPartyProfile.update({
    where: { id: profileId },
    data: {
      riskScore: result.score, riskLevel: result.level,
      recommendation: result.recommendation, mitigation: result.mitigations.join(" · "),
      lastScreenedAt: now, nextReviewAt: addDays(now, 180),
    },
  });
  if (!opts?.skipAlerts) await recomputeAlerts();
  return result;
}
