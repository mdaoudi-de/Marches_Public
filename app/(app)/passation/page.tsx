import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Progress, Badge, EmptyState, Card } from "@/components/ui";
import { MarketStatusBadge, NatureBadge } from "@/components/badges";
import { marketProgress, deriveStepStatus } from "@/lib/ecarts";
import { formatDate, humanDelay } from "@/lib/utils";
import { PROCEDURE_LABELS, label } from "@/lib/enums";

export default async function PassationPage() {
  const markets = await prisma.market.findMany({
    where: { status: { not: "CLOTURE" } },
    orderBy: { reference: "asc" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  return (
    <>
      <PageHeader title="Passation des marchés" subtitle="Suivi du déroulement des procédures et de leurs étapes de validation" />

      {markets.length === 0 ? (
        <EmptyState title="Aucune procédure en cours." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Procédure</th>
                <th>Statut</th>
                <th>Étape en cours</th>
                <th className="w-44">Avancement</th>
                <th>Retards</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => {
                const p = marketProgress(m.steps);
                const current = m.steps.find((s) => s.stepKind === "DATE" && deriveStepStatus(s) !== "REALISE");
                return (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/passation/${m.id}`} className="font-medium text-brand-700 hover:underline">{m.reference}</Link>
                      <div className="max-w-xs truncate text-xs text-slate-400">{m.intitule}</div>
                    </td>
                    <td className="text-slate-600">
                      <NatureBadge nature={m.nature} />
                      <div className="mt-0.5 text-xs text-slate-400">{label(PROCEDURE_LABELS, m.procedureType)}</div>
                    </td>
                    <td><MarketStatusBadge value={m.status} /></td>
                    <td className="text-sm">
                      {current ? (
                        <span className="text-slate-700">{current.stepName}
                          {deriveStepStatus(current) === "EN_RETARD" && <Badge tone="red" className="ml-2">en retard</Badge>}
                        </span>
                      ) : <span className="text-emerald-600">Passation terminée</span>}
                      {current?.plannedDate && <div className="text-xs text-slate-400">prévue {formatDate(current.plannedDate)}</div>}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={p.tauxExecution} tone={p.enRetard > 0 ? "amber" : "blue"} />
                        <span className="w-9 text-right text-xs text-slate-500">{p.tauxExecution}%</span>
                      </div>
                    </td>
                    <td>{p.enRetard > 0 ? <Badge tone="red">{p.enRetard}</Badge> : <span className="text-slate-300">0</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
