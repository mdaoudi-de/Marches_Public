import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, LinkButton, EmptyState, Badge } from "@/components/ui";
import { ScoreBadge, RiskBadge } from "@/components/badges";
import { SUPPLIER_TYPE_LABELS, label } from "@/lib/enums";

export default async function FournisseursPage() {
  const user = await getCurrentUser();
  const canEdit = can(user, "FOURNISSEURS", "edit");

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      evaluations: { select: { globalScore: true } },
      thirdPartyProfile: { select: { id: true, riskLevel: true } },
      _count: { select: { markets: true, contracts: true, evaluations: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Fournisseurs"
        subtitle={`Base unique — ${suppliers.length} fournisseur(s), historique et évaluation de performance`}
        actions={canEdit && <LinkButton href="/fournisseurs/new"><Plus className="h-4 w-4" /> Nouveau fournisseur</LinkButton>}
      />

      {suppliers.length === 0 ? (
        <EmptyState title="Aucun fournisseur." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Marchés</th>
                <th>Contrats</th>
                <th>Évaluations</th>
                <th>Note moyenne</th>
                <th>Due diligence</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const avg = s.evaluations.length
                  ? s.evaluations.reduce((a, e) => a + e.globalScore, 0) / s.evaluations.length
                  : null;
                return (
                  <tr key={s.id}>
                    <td>
                      <Link href={`/fournisseurs/${s.id}`} className="font-medium text-brand-700 hover:underline">{s.name}</Link>
                      {s.rccm && <div className="text-xs text-slate-400">RCCM {s.rccm}</div>}
                    </td>
                    <td className="text-slate-600">{label(SUPPLIER_TYPE_LABELS, s.type)}</td>
                    <td className="text-slate-600">{s.city ?? "—"}</td>
                    <td>{s._count.markets || <span className="text-slate-300">0</span>}</td>
                    <td>{s._count.contracts || <span className="text-slate-300">0</span>}</td>
                    <td>{s._count.evaluations || <span className="text-slate-300">0</span>}</td>
                    <td><ScoreBadge value={avg} /></td>
                    <td>
                      {s.thirdPartyProfile ? (
                        <Link href={`/tiers/${s.thirdPartyProfile.id}`} className="hover:underline">
                          {s.thirdPartyProfile.riskLevel ? <RiskBadge value={s.thirdPartyProfile.riskLevel} /> : <span className="text-slate-400">Voir</span>}
                        </Link>
                      ) : <span className="text-slate-300">—</span>}
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
