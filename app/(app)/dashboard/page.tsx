import Link from "next/link";
import { Briefcase, TrendingUp, AlertTriangle, Bell, Wallet, FileSignature } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader, StatCard, Card, CardHeader, CardBody, EmptyState } from "@/components/ui";
import { AlertSeverityBadge } from "@/components/badges";
import { StatusDonut, SimpleBar, HBar } from "@/components/dashboard/charts";
import { marketProgress } from "@/lib/ecarts";
import { formatCompactFC, formatDateTime, humanDelay } from "@/lib/utils";
import {
  MARKET_STATUS_LABELS, MARKET_STATUS_TONE, NATURE_SHORT, ALERT_TYPE_LABELS,
  AUDIT_ACTION_LABELS, label,
} from "@/lib/enums";

export default async function DashboardPage() {
  const markets = await prisma.market.findMany({ include: { steps: true } });
  const progresses = markets.map((m) => ({ m, p: marketProgress(m.steps) }));

  const totalSteps = progresses.reduce((s, x) => s + x.p.total, 0);
  const realizedSteps = progresses.reduce((s, x) => s + x.p.realises, 0);
  const tauxGlobal = totalSteps ? Math.round((realizedSteps / totalSteps) * 100) : 0;
  const enRetard = progresses.filter((x) => x.p.enRetard > 0).length;
  const enCours = markets.filter((m) => !["PREVU", "CLOTURE"].includes(m.status)).length;
  const budgetTotal = markets.reduce((s, m) => s + m.budgetAmountFC, 0);
  const contractualise = markets.reduce((s, m) => s + (m.contractAmountFC ?? 0), 0);

  const activeAlerts = await prisma.alert.count({ where: { status: "ACTIVE" } });
  const topAlerts = await prisma.alert.findMany({
    where: { status: "ACTIVE" },
    include: { market: { select: { id: true, reference: true } } },
    take: 30,
  });
  topAlerts.sort((a, b) => (a.severity === "CRITIQUE" ? -1 : 1) - (b.severity === "CRITIQUE" ? -1 : 1));

  // Répartitions
  const statusData = (Object.keys(MARKET_STATUS_LABELS) as (keyof typeof MARKET_STATUS_LABELS)[])
    .map((k) => ({ name: MARKET_STATUS_LABELS[k], value: markets.filter((m) => m.status === k).length, color: MARKET_STATUS_TONE[k] }))
    .filter((d) => d.value > 0);

  const natureData = (Object.keys(NATURE_SHORT) as (keyof typeof NATURE_SHORT)[])
    .map((k) => ({ name: NATURE_SHORT[k], value: markets.filter((m) => m.nature === k).length }));

  const alertTypeData = (Object.keys(ALERT_TYPE_LABELS) as (keyof typeof ALERT_TYPE_LABELS)[])
    .map((k) => ({ name: label(ALERT_TYPE_LABELS, k).split(" ").slice(0, 2).join(" "), value: topAlerts.filter((a) => a.type === k).length }))
    .filter((d) => d.value > 0);

  const topRetards = progresses
    .filter((x) => x.p.retardMoyen != null && x.p.retardMoyen > 0)
    .sort((a, b) => (b.p.retardMoyen! - a.p.retardMoyen!))
    .slice(0, 6)
    .map((x) => ({ name: x.m.reference, value: x.p.retardMoyen!, color: x.p.retardMoyen! > 15 ? "red" : "amber" }));

  const audit = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 7, include: { user: { select: { fullName: true } } } });

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Pilotage des marchés publics — synthèse au 15/07/2026" />

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="Marchés" value={markets.length} hint={`${enCours} en cours`} tone="blue" icon={<Briefcase className="h-4 w-4" />} />
        <StatCard label="Exécution globale" value={`${tauxGlobal}%`} hint={`${realizedSteps}/${totalSteps} étapes`} tone="green" icon={<TrendingUp className="h-4 w-4" />} />
        <StatCard label="Marchés en retard" value={enRetard} tone={enRetard ? "red" : "green"} icon={<AlertTriangle className="h-4 w-4" />} />
        <StatCard label="Alertes actives" value={activeAlerts} hint="voir les alertes" tone="amber" icon={<Bell className="h-4 w-4" />} />
        <StatCard label="Budget total" value={formatCompactFC(budgetTotal)} tone="violet" icon={<Wallet className="h-4 w-4" />} />
        <StatCard label="Contractualisé" value={formatCompactFC(contractualise)} tone="slate" icon={<FileSignature className="h-4 w-4" />} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Marchés par statut" />
          <CardBody><StatusDonut data={statusData} /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Marchés par nature" />
          <CardBody><SimpleBar data={natureData} color="violet" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Alertes par type" />
          <CardBody>{alertTypeData.length ? <SimpleBar data={alertTypeData} color="amber" /> : <EmptyState title="Aucune alerte active." />}</CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Retard moyen — top marchés" subtitle="écart prévu/réalisé (jours)" />
          <CardBody>{topRetards.length ? <HBar data={topRetards} /> : <EmptyState title="Aucun retard." />}</CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Alertes prioritaires" action={<Link href="/alertes" className="text-xs text-brand-600 hover:underline">Tout voir</Link>} />
          <CardBody className="space-y-2">
            {topAlerts.slice(0, 6).map((a) => (
              <div key={a.id} className="flex items-start gap-2 border-b border-slate-50 pb-2 last:border-0">
                <AlertSeverityBadge value={a.severity} />
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-700">{a.message}</p>
                  {a.market && <Link href={`/ppm/${a.market.id}`} className="text-xs text-brand-600 hover:underline">{a.market.reference}</Link>}
                </div>
              </div>
            ))}
            {topAlerts.length === 0 && <EmptyState title="Aucune alerte active." />}
          </CardBody>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader title="Activité récente" subtitle="journal d'audit" />
          <CardBody className="space-y-2">
            {audit.map((e) => (
              <div key={e.id} className="border-b border-slate-50 pb-2 text-sm last:border-0">
                <p className="text-slate-700"><span className="font-medium">{label(AUDIT_ACTION_LABELS, e.action)}</span> — {e.detail}</p>
                <p className="text-xs text-slate-400">{e.user?.fullName ?? "Système"} · {formatDateTime(e.createdAt)}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
