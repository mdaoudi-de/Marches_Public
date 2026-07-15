/**
 * Moteur de calcul des écarts « Prévision vs Réalisation ».
 * Fonctions PURES (testées par Vitest) — aucune dépendance à Prisma.
 */
import { differenceInCalendarDays } from "date-fns";
import { today } from "@/lib/config";
import type { StepStatus } from "@/lib/enums";
import type { Tone } from "@/components/ui-types";

export interface StepLike {
  stepKind?: string | null;
  plannedDate?: Date | string | null;
  actualDate?: Date | string | null;
  plannedAmountFC?: number | null;
  actualAmountFC?: number | null;
}

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Écart en jours = date réelle − date prévue. Positif = retard, négatif = avance. */
export function ecartJours(step: StepLike): number | null {
  const p = toDate(step.plannedDate);
  const a = toDate(step.actualDate);
  if (!p || !a) return null;
  return differenceInCalendarDays(a, p);
}

/** Nombre de jours de retard pour une étape échue non réalisée (sinon null). */
export function retardCourant(step: StepLike, now: Date = today()): number | null {
  const p = toDate(step.plannedDate);
  const a = toDate(step.actualDate);
  if (a || !p) return null;
  const d = differenceInCalendarDays(now, p);
  return d > 0 ? d : null;
}

/** Écart de montant (étapes de type MONTANT) = réel − prévu. */
export function ecartMontant(step: StepLike): number | null {
  if (step.plannedAmountFC == null || step.actualAmountFC == null) return null;
  return step.actualAmountFC - step.plannedAmountFC;
}

/** Statut dérivé au runtime (toujours cohérent avec les dates / montants). */
export function deriveStepStatus(step: StepLike, now: Date = today()): StepStatus {
  if ((step.stepKind ?? "DATE") === "MONTANT") {
    return step.actualAmountFC != null ? "REALISE" : "A_VENIR";
  }
  const p = toDate(step.plannedDate);
  const a = toDate(step.actualDate);
  if (a) return "REALISE";
  if (p && differenceInCalendarDays(now, p) > 0) return "EN_RETARD";
  return "A_VENIR";
}

/** Ton d'affichage d'un écart en jours (vert = à l'heure/avance, rouge = gros retard). */
export function ecartTone(ecartDays: number | null): Tone {
  if (ecartDays == null) return "gray";
  if (ecartDays <= 0) return "green";
  if (ecartDays <= 15) return "amber";
  return "red";
}

export interface MarketProgress {
  total: number;
  realises: number;
  enRetard: number;
  aVenir: number;
  tauxExecution: number; // 0..100
  retardMoyen: number | null; // moyenne des écarts (jours) sur les étapes réalisées datées
  retardMax: number | null;
  prochaineEcheance: Date | null; // prochaine date prévue non encore réalisée
}

/** Agrégats d'avancement d'un marché à partir de ses étapes. */
export function marketProgress(steps: StepLike[], now: Date = today()): MarketProgress {
  // On ne considère que les étapes de type DATE pour l'avancement chronologique.
  const dateSteps = steps.filter((s) => (s.stepKind ?? "DATE") === "DATE");
  const total = dateSteps.length;
  let realises = 0;
  let enRetard = 0;
  let aVenir = 0;
  const ecarts: number[] = [];
  let prochaineEcheance: Date | null = null;

  for (const s of dateSteps) {
    const st = deriveStepStatus(s, now);
    if (st === "REALISE") {
      realises++;
      const e = ecartJours(s);
      if (e != null) ecarts.push(e);
    } else if (st === "EN_RETARD") {
      enRetard++;
    } else {
      aVenir++;
      const p = toDate(s.plannedDate);
      if (p && (!prochaineEcheance || p < prochaineEcheance)) prochaineEcheance = p;
    }
  }

  const retardMoyen = ecarts.length ? Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length) : null;
  const retardMax = ecarts.length ? Math.max(...ecarts) : null;

  return {
    total,
    realises,
    enRetard,
    aVenir,
    tauxExecution: total ? Math.round((realises / total) * 100) : 0,
    retardMoyen,
    retardMax,
    prochaineEcheance,
  };
}
