import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, LinkButton, Card, Progress, Badge, EmptyState } from "@/components/ui";
import { MarketStatusBadge, NatureBadge } from "@/components/badges";
import { marketProgress } from "@/lib/ecarts";
import { formatCompactFC, humanDelay } from "@/lib/utils";
import { NATURE_LABELS, MARKET_STATUS_LABELS, PROCEDURE_LABELS, label } from "@/lib/enums";

export default async function PpmPage({
  searchParams,
}: {
  searchParams: Promise<{ nature?: string; status?: string; year?: string; q?: string; direction?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const canEdit = can(user, "PPM", "edit");

  const where: Record<string, unknown> = {};
  if (sp.nature) where.nature = sp.nature;
  if (sp.status) where.status = sp.status;
  if (sp.year) where.fiscalYear = Number(sp.year);
  if (sp.direction) where.directionId = Number(sp.direction);
  if (sp.q) where.OR = [{ intitule: { contains: sp.q } }, { reference: { contains: sp.q } }];

  const markets = await prisma.market.findMany({
    where,
    orderBy: { reference: "asc" },
    include: { steps: true, awardedSupplier: { select: { name: true } }, direction: { select: { name: true } } },
  });

  const years = [...new Set((await prisma.market.findMany({ select: { fiscalYear: true } })).map((m) => m.fiscalYear))].sort();
  const directions = await prisma.direction.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader
        title="Plan de Passation des Marchés"
        subtitle={`${markets.length} marché(s) — suivi Prévu / Réalisé et écarts`}
        actions={
          <>
            <LinkButton href="/api/export/ppm" variant="outline">
              <Download className="h-4 w-4" /> Export Excel
            </LinkButton>
            {canEdit && (
              <LinkButton href="/ppm/new">
                <Plus className="h-4 w-4" /> Nouveau marché
              </LinkButton>
            )}
          </>
        }
      />

      {/* Filtres (GET, sans JS) */}
      <Card className="mb-4 p-3">
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Recherche</span>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Intitulé ou référence"
              className="w-56 rounded-md border border-slate-300 px-3 py-1.5" />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Nature</span>
            <select name="nature" defaultValue={sp.nature ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Toutes</option>
              {Object.entries(NATURE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Statut</span>
            <select name="status" defaultValue={sp.status ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Tous</option>
              {Object.entries(MARKET_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Direction</span>
            <select name="direction" defaultValue={sp.direction ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Toutes</option>
              {directions.map((dr) => <option key={dr.id} value={dr.id}>{dr.name}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Exercice</span>
            <select name="year" defaultValue={sp.year ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Tous</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700">Filtrer</button>
          <Link href="/ppm" className="px-2 py-1.5 text-slate-500 hover:underline">Réinitialiser</Link>
        </form>
      </Card>

      {markets.length === 0 ? (
        <EmptyState title="Aucun marché ne correspond aux filtres." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Intitulé</th>
                <th>Nature</th>
                <th>Budget</th>
                <th>Statut</th>
                <th className="w-48">Avancement</th>
                <th>Écart moyen</th>
                <th>Retards</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m) => {
                const p = marketProgress(m.steps);
                return (
                  <tr key={m.id}>
                    <td>
                      <Link href={`/ppm/${m.id}`} className="font-medium text-brand-700 hover:underline">{m.reference}</Link>
                    </td>
                    <td className="max-w-xs">
                      <Link href={`/ppm/${m.id}`} className="text-slate-800 hover:underline">{m.intitule}</Link>
                      <div className="text-xs text-slate-400">{label(PROCEDURE_LABELS, m.procedureType)}{m.direction ? ` · ${m.direction.name}` : ""}</div>
                    </td>
                    <td><NatureBadge nature={m.nature} /></td>
                    <td className="whitespace-nowrap text-slate-600">{formatCompactFC(m.budgetAmountFC)}</td>
                    <td><MarketStatusBadge value={m.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={p.tauxExecution} tone={p.enRetard > 0 ? "amber" : "green"} />
                        <span className="w-9 text-right text-xs text-slate-500">{p.tauxExecution}%</span>
                      </div>
                    </td>
                    <td>
                      {p.retardMoyen == null ? <span className="text-slate-300">—</span> : (
                        <Badge tone={p.retardMoyen <= 0 ? "green" : p.retardMoyen <= 15 ? "amber" : "red"}>
                          {humanDelay(p.retardMoyen)}
                        </Badge>
                      )}
                    </td>
                    <td>
                      {p.enRetard > 0 ? <Badge tone="red">{p.enRetard}</Badge> : <span className="text-slate-300">0</span>}
                    </td>
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
