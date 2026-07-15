import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, EmptyState, Progress } from "@/components/ui";
import { ContractStatusBadge } from "@/components/badges";
import { CONTRACT_TYPE_LABELS, label } from "@/lib/enums";
import { formatCompactFC, formatDate } from "@/lib/utils";

export default async function ContratsPage() {
  const contracts = await prisma.contract.findMany({
    orderBy: { reference: "asc" },
    include: {
      market: { select: { id: true, reference: true, intitule: true } },
      supplier: { select: { name: true } },
      purchaseOrders: { select: { amountFC: true, status: true } },
    },
  });

  return (
    <>
      <PageHeader title="Contrats & exécution" subtitle={`${contracts.length} contrat(s) — garanties, paiements, livraisons, avenants, bons de commande`} />

      {contracts.length === 0 ? (
        <EmptyState title="Aucun contrat." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Marché</th>
                <th>Fournisseur</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Échéance</th>
                <th>Consommation (cadre)</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const consomme = c.purchaseOrders.filter((p) => p.status !== "ANNULEE").reduce((s, p) => s + p.amountFC, 0);
                const pct = c.type === "CONTRAT_CADRE" && c.amountFC ? Math.round((consomme / c.amountFC) * 100) : null;
                return (
                  <tr key={c.id}>
                    <td><Link href={`/contrats/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.reference}</Link></td>
                    <td>
                      <Link href={`/ppm/${c.market.id}`} className="text-slate-700 hover:underline">{c.market.reference}</Link>
                      <div className="max-w-[16rem] truncate text-xs text-slate-400">{c.market.intitule}</div>
                    </td>
                    <td className="text-slate-600">{c.supplier.name}</td>
                    <td className="text-slate-600">{label(CONTRACT_TYPE_LABELS, c.type)}</td>
                    <td className="whitespace-nowrap text-slate-700">{formatCompactFC(c.amountFC)}</td>
                    <td><ContractStatusBadge value={c.status} /></td>
                    <td className="whitespace-nowrap text-slate-600">{formatDate(c.endDate)}</td>
                    <td>
                      {pct == null ? <span className="text-slate-300">—</span> : (
                        <div className="flex items-center gap-2">
                          <Progress value={pct} tone={pct > 85 ? "red" : "blue"} />
                          <span className="w-9 text-right text-xs text-slate-500">{pct}%</span>
                        </div>
                      )}
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
