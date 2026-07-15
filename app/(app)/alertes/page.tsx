import Link from "next/link";
import { RefreshCw, BellOff, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Button } from "@/components/ui";
import { AlertSeverityBadge } from "@/components/badges";
import { ALERT_TYPE_LABELS, ALERT_STATUS_LABELS, label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { acknowledgeAlert, resolveAlert, recomputeAlertsAction } from "@/actions/alertes";

const SEVERITY_ORDER: Record<string, number> = { CRITIQUE: 0, WARNING: 1, INFO: 2 };

export default async function AlertesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const sp = await searchParams;
  const showAll = sp.show === "all";

  const alerts = await prisma.alert.findMany({
    where: showAll ? {} : { status: "ACTIVE" },
    include: { market: { select: { id: true, reference: true } } },
  });
  alerts.sort((a, b) => (SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]) || ((a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0)));

  const activeCount = await prisma.alert.count({ where: { status: "ACTIVE" } });
  const critiques = alerts.filter((a) => a.status === "ACTIVE" && a.severity === "CRITIQUE").length;

  return (
    <>
      <PageHeader
        title="Alertes & échéances"
        subtitle={`${activeCount} alerte(s) active(s)${critiques ? ` · ${critiques} critique(s)` : ""}`}
        actions={
          <form action={recomputeAlertsAction}>
            <Button type="submit" variant="outline"><RefreshCw className="h-4 w-4" /> Recalculer</Button>
          </form>
        }
      />

      <div className="mb-4 flex gap-2 text-sm">
        <Link href="/alertes" className={`rounded-md px-3 py-1.5 ${!showAll ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Actives</Link>
        <Link href="/alertes?show=all" className={`rounded-md px-3 py-1.5 ${showAll ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Toutes</Link>
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="Aucune alerte." hint="Toutes les échéances sont sous contrôle." />
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => (
            <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
              <div className="flex items-start gap-3">
                <AlertSeverityBadge value={a.severity} />
                <div>
                  <p className="text-sm font-medium text-slate-800">{label(ALERT_TYPE_LABELS, a.type)}</p>
                  <p className="text-sm text-slate-600">{a.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.market && <Link href={`/ppm/${a.market.id}`} className="text-brand-600 hover:underline">{a.market.reference}</Link>}
                    {a.dueDate && <> · échéance {formatDate(a.dueDate)}</>}
                    {a.status !== "ACTIVE" && <> · <Badge tone="gray">{label(ALERT_STATUS_LABELS, a.status)}</Badge></>}
                  </p>
                </div>
              </div>
              {a.status === "ACTIVE" && (
                <div className="flex gap-1.5">
                  <form action={acknowledgeAlert.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="outline"><Check className="h-3.5 w-3.5" /> Acquitter</Button>
                  </form>
                  <form action={resolveAlert.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="ghost"><BellOff className="h-3.5 w-3.5" /> Résoudre</Button>
                  </form>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
