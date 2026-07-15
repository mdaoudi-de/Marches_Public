import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, LinkButton } from "@/components/ui";
import { MarketStatusBadge, NatureBadge } from "@/components/badges";
import { MarketGrid, type GridStep } from "@/components/ppm/market-grid";
import { formatDateTime, toDateInput } from "@/lib/utils";

const CHANGE_LABELS: Record<string, string> = {
  UPDATE_ACTUAL: "Réalisation saisie",
  UPDATE_PLANNED: "Prévision modifiée",
  VALIDATE: "Validation",
  COMMENT: "Commentaire",
};

export default async function PassationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const market = await prisma.market.findUnique({
    where: { id: Number(id) },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  if (!market) notFound();

  const history = await prisma.marketStepHistory.findMany({
    where: { marketStep: { marketId: market.id } },
    include: { marketStep: { select: { stepName: true } }, user: { select: { fullName: true } } },
    orderBy: { at: "desc" },
    take: 40,
  });

  const canEdit = can(user, "PASSATION", "edit");
  const canValidate = can(user, "PASSATION", "validate");

  const gridSteps: GridStep[] = market.steps.map((s) => ({
    id: s.id, phaseName: s.phaseName, stepName: s.stepName, order: s.order, stepKind: s.stepKind,
    plannedDate: s.plannedDate ? toDateInput(s.plannedDate) : null,
    actualDate: s.actualDate ? toDateInput(s.actualDate) : null,
    plannedAmountFC: s.plannedAmountFC, actualAmountFC: s.actualAmountFC,
    validatedAt: s.validatedAt ? toDateInput(s.validatedAt) : null,
  }));

  return (
    <>
      <div className="mb-3">
        <Link href="/passation" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Passation
        </Link>
      </div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{market.reference} <MarketStatusBadge value={market.status} /> <NatureBadge nature={market.nature} /></span>}
        subtitle={market.intitule}
        actions={<LinkButton href={`/ppm/${market.id}`} variant="outline">Fiche PPM</LinkButton>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-semibold text-slate-800">Workflow des étapes</h2>
          <MarketGrid steps={gridSteps} canEdit={canEdit} canValidate={canValidate} />
        </div>

        <div>
          <Card>
            <CardHeader title={<span className="flex items-center gap-2"><History className="h-4 w-4" /> Historique</span>} subtitle="traçabilité des saisies et validations" />
            <CardBody className="space-y-3">
              {history.length === 0 && <p className="text-sm text-slate-400">Aucune action enregistrée.</p>}
              {history.map((h) => (
                <div key={h.id} className="border-l-2 border-slate-200 pl-3 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium">{CHANGE_LABELS[h.changeType] ?? h.changeType}</span>
                    {" — "}{h.marketStep.stepName}
                  </p>
                  {h.newValue && <p className="text-xs text-slate-500">→ {h.newValue}</p>}
                  <p className="text-xs text-slate-400">{h.user?.fullName ?? "Système"} · {formatDateTime(h.at)}</p>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
