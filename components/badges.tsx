import { Badge } from "@/components/ui";
import type { Tone } from "@/components/ui-types";
import {
  MARKET_STATUS_LABELS, MARKET_STATUS_TONE,
  STEP_STATUS_LABELS, STEP_STATUS_TONE,
  CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE,
  RECEPTION_STATUS_LABELS, RECEPTION_STATUS_TONE,
  GUARANTEE_STATUS_LABELS, GUARANTEE_STATUS_TONE,
  PO_STATUS_LABELS, PO_STATUS_TONE,
  PR_STATUS_LABELS, PR_STATUS_TONE,
  ALERT_SEVERITY_LABELS, ALERT_SEVERITY_TONE,
  NATURE_LABELS, PROCEDURE_LABELS,
  label,
} from "@/lib/enums";
import { deriveStepStatus, type StepLike } from "@/lib/ecarts";

function make(labels: Record<string, string>, tones: Record<string, Tone>) {
  return function StatusBadge({ value }: { value: string }) {
    return <Badge tone={tones[value] ?? "slate"}>{label(labels, value)}</Badge>;
  };
}

export const MarketStatusBadge = make(MARKET_STATUS_LABELS, MARKET_STATUS_TONE);
export const ContractStatusBadge = make(CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE);
export const PaymentStatusBadge = make(PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE);
export const ReceptionStatusBadge = make(RECEPTION_STATUS_LABELS, RECEPTION_STATUS_TONE);
export const GuaranteeStatusBadge = make(GUARANTEE_STATUS_LABELS, GUARANTEE_STATUS_TONE);
export const POStatusBadge = make(PO_STATUS_LABELS, PO_STATUS_TONE);
export const PRStatusBadge = make(PR_STATUS_LABELS, PR_STATUS_TONE);
export const AlertSeverityBadge = make(ALERT_SEVERITY_LABELS, ALERT_SEVERITY_TONE);

/** Statut d'étape dérivé au runtime à partir des dates. */
export function StepStatusBadge({ step }: { step: StepLike }) {
  const s = deriveStepStatus(step);
  return <Badge tone={STEP_STATUS_TONE[s]}>{STEP_STATUS_LABELS[s]}</Badge>;
}

export function NatureBadge({ nature }: { nature: string }) {
  const tone: Tone =
    nature === "TRAVAUX" ? "blue" : nature === "FOURNITURES_SERVICES" ? "violet" : "amber";
  return <Badge tone={tone}>{label(NATURE_LABELS, nature)}</Badge>;
}

export function ProcedureText({ procedureType }: { procedureType: string }) {
  return <span className="text-slate-600">{label(PROCEDURE_LABELS, procedureType)}</span>;
}

/** Note /5 avec ton selon la valeur. */
export function ScoreBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-slate-300">—</span>;
  const tone: Tone = value >= 4 ? "green" : value >= 2.5 ? "amber" : "red";
  return <Badge tone={tone}>{value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 5</Badge>;
}
