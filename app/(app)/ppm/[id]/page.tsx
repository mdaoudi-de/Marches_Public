import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText, Gavel, ArrowLeft, FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, StatCard, LinkButton, Badge } from "@/components/ui";
import { MarketStatusBadge, NatureBadge } from "@/components/badges";
import { MarketGrid, type GridStep } from "@/components/ppm/market-grid";
import { marketProgress } from "@/lib/ecarts";
import { formatFC, formatDate, humanDelay, toDateInput } from "@/lib/utils";
import { PROCEDURE_LABELS, label } from "@/lib/enums";

export default async function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const market = await prisma.market.findUnique({
    where: { id: Number(id) },
    include: {
      steps: { orderBy: { order: "asc" } },
      template: { select: { name: true } },
      awardedSupplier: { select: { id: true, name: true } },
      createdBy: { select: { fullName: true } },
      contracts: { select: { id: true } },
      _count: { select: { documents: true } },
    },
  });
  if (!market) notFound();

  const p = marketProgress(market.steps);
  const canEdit = can(user, "PPM", "edit");
  const canValidate = can(user, "PPM", "validate");

  const gridSteps: GridStep[] = market.steps.map((s) => ({
    id: s.id,
    phaseName: s.phaseName,
    stepName: s.stepName,
    order: s.order,
    stepKind: s.stepKind,
    plannedDate: s.plannedDate ? toDateInput(s.plannedDate) : null,
    actualDate: s.actualDate ? toDateInput(s.actualDate) : null,
    plannedAmountFC: s.plannedAmountFC,
    actualAmountFC: s.actualAmountFC,
    validatedAt: s.validatedAt ? toDateInput(s.validatedAt) : null,
  }));

  const meta: [string, React.ReactNode][] = [
    ["Procédure", label(PROCEDURE_LABELS, market.procedureType)],
    ["Budget prévisionnel", formatFC(market.budgetAmountFC)],
    ["Montant du contrat", market.contractAmountFC != null ? formatFC(market.contractAmountFC) : "—"],
    ["Fournisseur attributaire", market.awardedSupplier ? (
      <Link href={`/fournisseurs/${market.awardedSupplier.id}`} className="text-brand-700 hover:underline">{market.awardedSupplier.name}</Link>
    ) : "—"],
    ["Code budgétaire", market.budgetCode ?? "—"],
    ["N° d'appel d'offres", market.aoNumber ?? "—"],
    ["Exercice", String(market.fiscalYear)],
    ["Modèle de procédure", market.template?.name ?? "—"],
    ["Créé par", market.createdBy.fullName],
  ];

  return (
    <>
      <div className="mb-3">
        <Link href="/ppm" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Plan de passation
        </Link>
      </div>

      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{market.reference} <MarketStatusBadge value={market.status} /> <NatureBadge nature={market.nature} /></span>}
        subtitle={market.intitule}
        actions={
          <>
            <LinkButton href={`/api/export/ppm?market=${market.id}`} variant="outline"><Download className="h-4 w-4" /> Excel</LinkButton>
            <LinkButton href={`/api/export/ppm?market=${market.id}&format=pdf`} variant="outline"><FileText className="h-4 w-4" /> PDF</LinkButton>
            <LinkButton href={`/passation/${market.id}`} variant="outline"><Gavel className="h-4 w-4" /> Passation</LinkButton>
            {market.contracts[0] && (
              <LinkButton href={`/contrats/${market.contracts[0].id}`} variant="outline"><FileSignature className="h-4 w-4" /> Contrat</LinkButton>
            )}
          </>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Taux d'exécution" value={`${p.tauxExecution}%`} hint={`${p.realises}/${p.total} étapes`} tone="blue" />
        <StatCard label="Écart moyen" value={p.retardMoyen == null ? "—" : humanDelay(p.retardMoyen)} hint="prévu vs réalisé" tone={p.retardMoyen != null && p.retardMoyen > 15 ? "red" : "green"} />
        <StatCard label="Étapes en retard" value={p.enRetard} tone={p.enRetard > 0 ? "red" : "green"} />
        <StatCard label="Prochaine échéance" value={p.prochaineEcheance ? formatDate(p.prochaineEcheance) : "—"} tone="amber" />
      </div>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {meta.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-50 py-1.5 text-sm">
              <span className="text-slate-500">{k}</span>
              <span className="text-right font-medium text-slate-800">{v}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Étapes — Prévu / Réalisé</h2>
        <span className="text-xs text-slate-400">
          {market._count.documents} document(s) ·{" "}
          <Link href={`/ged?q=${encodeURIComponent(market.reference)}`} className="hover:underline">voir la GED</Link>
        </span>
      </div>
      <MarketGrid steps={gridSteps} canEdit={canEdit} canValidate={canValidate} />
    </>
  );
}
