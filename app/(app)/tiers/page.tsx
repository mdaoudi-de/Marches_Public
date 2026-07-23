import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, LinkButton, EmptyState, StatCard, Badge } from "@/components/ui";
import { RiskBadge, DecisionBadge, StageBadge } from "@/components/badges";
import { formatDate } from "@/lib/utils";

export default async function TiersPage() {
  const user = await getCurrentUser();
  const canEdit = can(user, "TIERS", "edit");

  const profiles = await prisma.thirdPartyProfile.findMany({
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: [{ riskScore: "desc" }],
  });

  const count = (lvl: string) => profiles.filter((p) => p.riskLevel === lvl).length;

  return (
    <>
      <PageHeader
        title="Tiers & Due Diligence"
        subtitle={`Module 8 — Screening, due diligence et intelligence sur les tiers (${profiles.length} tiers)`}
        actions={canEdit && <LinkButton href="/tiers/new"><Plus className="h-4 w-4" /> Nouveau tiers</LinkButton>}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Risque faible" value={count("FAIBLE")} tone="green" />
        <StatCard label="Risque moyen" value={count("MOYEN")} tone="amber" />
        <StatCard label="Risque élevé" value={count("ELEVE")} tone="red" />
        <StatCard label="Risque critique" value={count("CRITIQUE")} tone="red" icon={<ShieldCheck className="h-4 w-4" />} />
      </div>

      {profiles.length === 0 ? (
        <EmptyState title="Aucun tiers enregistré." hint="Créez un premier profil de tiers." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tiers</th><th>Fournisseur lié</th><th>Score</th><th>Niveau de risque</th>
                <th>Décision</th><th>Étape</th><th>Prochaine réévaluation</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id}>
                  <td><Link href={`/tiers/${p.id}`} className="font-medium text-brand-700 hover:underline">{p.denomination}</Link></td>
                  <td className="text-slate-600">
                    {p.supplier ? <Link href={`/fournisseurs/${p.supplier.id}`} className="hover:underline">{p.supplier.name}</Link> : "—"}
                  </td>
                  <td className="font-semibold text-slate-700">{p.riskScore != null ? `${Math.round(p.riskScore)}/100` : "—"}</td>
                  <td>{p.riskLevel ? <RiskBadge value={p.riskLevel} /> : <span className="text-slate-300">—</span>}</td>
                  <td>{p.decision ? <DecisionBadge value={p.decision} /> : <Badge tone="gray">En cours</Badge>}</td>
                  <td><StageBadge value={p.stage} /></td>
                  <td className="whitespace-nowrap text-slate-500">{formatDate(p.nextReviewAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
