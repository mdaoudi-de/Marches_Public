"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, ShieldCheck } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { formatDate, formatFC, humanDelay, cn } from "@/lib/utils";
import { ecartJours, ecartMontant, ecartTone, deriveStepStatus } from "@/lib/ecarts";
import { STEP_STATUS_LABELS, STEP_STATUS_TONE } from "@/lib/enums";
import { recordStepActual, recordStepPlanned, recordStepAmount, validateStep } from "@/actions/ppm";

export interface GridStep {
  id: number;
  phaseName: string;
  stepName: string;
  order: number;
  stepKind: string;
  plannedDate: string | null;
  actualDate: string | null;
  plannedAmountFC: number | null;
  actualAmountFC: number | null;
  validatedAt: string | null;
}

function isNonObjection(name: string) {
  return /non-?objection/i.test(name);
}

export function MarketGrid({
  steps,
  canEdit,
  canValidate,
}: {
  steps: GridStep[];
  canEdit: boolean;
  canValidate: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  // Champs d'édition locaux
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [pAmount, setPAmount] = useState("");
  const [aAmount, setAAmount] = useState("");

  function beginEdit(s: GridStep) {
    setEditing(s.id);
    setPlanned(s.plannedDate ?? "");
    setActual(s.actualDate ?? "");
    setPAmount(s.plannedAmountFC != null ? String(s.plannedAmountFC) : "");
    setAAmount(s.actualAmountFC != null ? String(s.actualAmountFC) : "");
  }

  function save(s: GridStep) {
    startTransition(async () => {
      if (s.stepKind === "MONTANT") {
        await recordStepAmount(s.id, pAmount, aAmount);
      } else {
        if (planned !== (s.plannedDate ?? "")) await recordStepPlanned(s.id, planned);
        if (actual !== (s.actualDate ?? "")) await recordStepActual(s.id, actual);
      }
      setEditing(null);
      router.refresh();
    });
  }

  function doValidate(s: GridStep) {
    startTransition(async () => {
      await validateStep(s.id);
      router.refresh();
    });
  }

  // Regroupement par phase (ordre préservé)
  const phases: { name: string; rows: GridStep[] }[] = [];
  for (const s of steps) {
    let ph = phases.find((p) => p.name === s.phaseName);
    if (!ph) { ph = { name: s.phaseName, rows: [] }; phases.push(ph); }
    ph.rows.push(s);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="data-table">
        <thead>
          <tr>
            <th className="w-[34%]">Étape</th>
            <th>Prévision</th>
            <th>Réalisation</th>
            <th>Écart</th>
            <th>Statut</th>
            {(canEdit || canValidate) && <th className="no-print text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {phases.map((ph) => (
            <PhaseBlock
              key={ph.name}
              phase={ph}
              editing={editing}
              pending={pending}
              canEdit={canEdit}
              canValidate={canValidate}
              planned={planned} actual={actual} pAmount={pAmount} aAmount={aAmount}
              setPlanned={setPlanned} setActual={setActual} setPAmount={setPAmount} setAAmount={setAAmount}
              beginEdit={beginEdit} save={save} cancel={() => setEditing(null)} doValidate={doValidate}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PhaseBlock(props: {
  phase: { name: string; rows: GridStep[] };
  editing: number | null; pending: boolean; canEdit: boolean; canValidate: boolean;
  planned: string; actual: string; pAmount: string; aAmount: string;
  setPlanned: (v: string) => void; setActual: (v: string) => void; setPAmount: (v: string) => void; setAAmount: (v: string) => void;
  beginEdit: (s: GridStep) => void; save: (s: GridStep) => void; cancel: () => void; doValidate: (s: GridStep) => void;
}) {
  const { phase, editing, pending, canEdit, canValidate } = props;
  const cols = canEdit || canValidate ? 6 : 5;
  return (
    <>
      <tr className="bg-slate-100/70">
        <td colSpan={cols} className="!py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {phase.name}
        </td>
      </tr>
      {phase.rows.map((s) => {
        const isEditing = editing === s.id;
        const isMontant = s.stepKind === "MONTANT";
        const st = deriveStepStatus({ plannedDate: s.plannedDate, actualDate: s.actualDate, stepKind: s.stepKind, plannedAmountFC: s.plannedAmountFC, actualAmountFC: s.actualAmountFC });
        const ecart = isMontant
          ? ecartMontant({ plannedAmountFC: s.plannedAmountFC, actualAmountFC: s.actualAmountFC })
          : ecartJours({ plannedDate: s.plannedDate, actualDate: s.actualDate });
        const tone = isMontant ? (ecart == null ? "gray" : ecart > 0 ? "red" : "green") : ecartTone(ecart);

        return (
          <tr key={s.id}>
            <td>
              <span className="text-slate-800">{s.stepName}</span>
              {isNonObjection(s.stepName) && (
                <Badge tone="violet" className="ml-2">non-objection</Badge>
              )}
              {s.validatedAt && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-[11px] text-emerald-600">
                  <ShieldCheck className="h-3 w-3" /> validée
                </span>
              )}
            </td>

            {/* Prévision */}
            <td>
              {isEditing ? (
                isMontant ? (
                  <input type="number" value={props.pAmount} onChange={(e) => props.setPAmount(e.target.value)}
                    className="w-36 rounded border border-slate-300 px-2 py-1 text-sm" placeholder="Montant prévu" />
                ) : (
                  <input type="date" value={props.planned} onChange={(e) => props.setPlanned(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm" />
                )
              ) : isMontant ? (
                <span className="text-slate-600">{s.plannedAmountFC != null ? formatFC(s.plannedAmountFC) : "—"}</span>
              ) : (
                <span className="text-slate-600">{formatDate(s.plannedDate)}</span>
              )}
            </td>

            {/* Réalisation */}
            <td>
              {isEditing ? (
                isMontant ? (
                  <input type="number" value={props.aAmount} onChange={(e) => props.setAAmount(e.target.value)}
                    className="w-36 rounded border border-slate-300 px-2 py-1 text-sm" placeholder="Montant réel" />
                ) : (
                  <input type="date" value={props.actual} onChange={(e) => props.setActual(e.target.value)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm" />
                )
              ) : isMontant ? (
                <span className={cn(s.actualAmountFC != null ? "font-medium text-slate-800" : "text-slate-400")}>
                  {s.actualAmountFC != null ? formatFC(s.actualAmountFC) : "—"}
                </span>
              ) : (
                <span className={cn(s.actualDate ? "font-medium text-slate-800" : "text-slate-400")}>
                  {formatDate(s.actualDate)}
                </span>
              )}
            </td>

            {/* Écart */}
            <td>
              {ecart == null ? (
                <span className="text-slate-300">—</span>
              ) : (
                <Badge tone={tone}>{isMontant ? formatFC(ecart) : humanDelay(ecart)}</Badge>
              )}
            </td>

            {/* Statut */}
            <td><Badge tone={STEP_STATUS_TONE[st]}>{STEP_STATUS_LABELS[st]}</Badge></td>

            {/* Actions */}
            {(canEdit || canValidate) && (
              <td className="no-print text-right">
                {isEditing ? (
                  <span className="inline-flex gap-1">
                    <Button size="sm" variant="success" disabled={pending} onClick={() => props.save(s)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={props.cancel}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </span>
                ) : (
                  <span className="inline-flex gap-1">
                    {canEdit && (
                      <Button size="sm" variant="outline" onClick={() => props.beginEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canValidate && isNonObjection(s.stepName) && !s.validatedAt && (
                      <Button size="sm" variant="secondary" disabled={pending} onClick={() => props.doValidate(s)}>
                        Valider
                      </Button>
                    )}
                  </span>
                )}
              </td>
            )}
          </tr>
        );
      })}
    </>
  );
}
