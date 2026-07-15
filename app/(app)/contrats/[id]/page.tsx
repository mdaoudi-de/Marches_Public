import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, StatCard, Badge, Button, LinkButton, EmptyState } from "@/components/ui";
import { ContractStatusBadge, PaymentStatusBadge, ReceptionStatusBadge, GuaranteeStatusBadge, POStatusBadge } from "@/components/badges";
import {
  CONTRACT_TYPE_LABELS, GUARANTEE_TYPE_LABELS, PAYMENT_TYPE_LABELS, RECEPTION_TYPE_LABELS,
  SERVICE_ORDER_TYPE_LABELS, AMENDMENT_STATUS_LABELS, label,
} from "@/lib/enums";
import { formatFC, formatDate } from "@/lib/utils";
import { markPaymentPaid, markReceptionDone } from "@/actions/contrats";

function Section({ title, children, count }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <Card className="mt-4">
      <CardHeader title={<span>{title}{count != null && <span className="ml-2 text-sm font-normal text-slate-400">({count})</span>}</span>} />
      <CardBody className="p-0">{children}</CardBody>
    </Card>
  );
}

export default async function ContratDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const canEdit = can(user, "CONTRATS", "edit");
  const cid = Number(id);

  const c = await prisma.contract.findUnique({
    where: { id: cid },
    include: {
      market: { select: { id: true, reference: true, intitule: true } },
      supplier: { select: { id: true, name: true } },
      guarantees: true, payments: { orderBy: { dueDate: "asc" } }, receptions: true,
      penalties: true, amendments: true, serviceOrders: { orderBy: { date: "asc" } },
      purchaseOrders: { orderBy: { orderDate: "asc" } },
    },
  });
  if (!c) notFound();

  const isCadre = c.type === "CONTRAT_CADRE";
  const consomme = c.purchaseOrders.filter((p) => p.status !== "ANNULEE").reduce((s, p) => s + p.amountFC, 0);
  const restant = c.amountFC - consomme;

  const meta: [string, React.ReactNode][] = [
    ["Marché", <Link key="m" href={`/ppm/${c.market.id}`} className="text-brand-700 hover:underline">{c.market.reference}</Link>],
    ["Fournisseur", <Link key="s" href={`/fournisseurs/${c.supplier.id}`} className="text-brand-700 hover:underline">{c.supplier.name}</Link>],
    ["Type", label(CONTRACT_TYPE_LABELS, c.type)],
    ["Montant" + (isCadre ? " (plafond)" : ""), formatFC(c.amountFC)],
    ["Signature", formatDate(c.signatureDate)],
    ["Début", formatDate(c.startDate)],
    ["Échéance", formatDate(c.endDate)],
    ["Durée", c.durationDays ? `${c.durationDays} j` : "—"],
    ["Retenue de garantie", c.guaranteeRetentionPct != null ? `${c.guaranteeRetentionPct} %` : "—"],
  ];

  return (
    <>
      <div className="mb-3">
        <Link href="/contrats" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Contrats
        </Link>
      </div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{c.reference} <ContractStatusBadge value={c.status} /></span>}
        subtitle={c.market.intitule}
        actions={<LinkButton href={`/ppm/${c.market.id}`} variant="outline">Fiche PPM</LinkButton>}
      />

      <Card>
        <CardBody className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
          {meta.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-slate-50 py-1.5 text-sm">
              <span className="text-slate-500">{k}</span><span className="text-right font-medium text-slate-800">{v}</span>
            </div>
          ))}
        </CardBody>
      </Card>

      {isCadre && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="Plafond" value={formatFC(c.amountFC)} tone="slate" />
          <StatCard label="Consommé" value={formatFC(consomme)} tone="blue" hint={`${c.amountFC ? Math.round((consomme / c.amountFC) * 100) : 0}%`} />
          <StatCard label="Restant" value={formatFC(restant)} tone={restant < c.amountFC * 0.15 ? "red" : "green"} />
        </div>
      )}

      {isCadre && (
        <Section title="Bons de commande" count={c.purchaseOrders.length}>
          <table className="data-table">
            <thead><tr><th>Référence</th><th>Objet</th><th>Date</th><th>Montant</th><th>Livraison</th><th>Statut</th></tr></thead>
            <tbody>
              {c.purchaseOrders.map((po) => (
                <tr key={po.id}>
                  <td className="font-medium text-slate-700">{po.reference}</td>
                  <td className="text-slate-600">{po.description}</td>
                  <td>{formatDate(po.orderDate)}</td>
                  <td className="whitespace-nowrap">{formatFC(po.amountFC)}</td>
                  <td>{formatDate(po.deliveryDate)}</td>
                  <td><POStatusBadge value={po.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title="Garanties" count={c.guarantees.length}>
        {c.guarantees.length === 0 ? <EmptyState title="Aucune garantie." /> : (
          <table className="data-table">
            <thead><tr><th>Type</th><th>Montant</th><th>Émission</th><th>Expiration</th><th>Statut</th></tr></thead>
            <tbody>
              {c.guarantees.map((g) => (
                <tr key={g.id}>
                  <td className="text-slate-700">{label(GUARANTEE_TYPE_LABELS, g.type)}</td>
                  <td className="whitespace-nowrap">{formatFC(g.amountFC)}</td>
                  <td>{formatDate(g.issueDate)}</td>
                  <td>{formatDate(g.expiryDate)}</td>
                  <td><GuaranteeStatusBadge value={g.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Paiements" count={c.payments.length}>
        {c.payments.length === 0 ? <EmptyState title="Aucun paiement." /> : (
          <table className="data-table">
            <thead><tr><th>Référence</th><th>Type</th><th>Montant</th><th>Échéance</th><th>Réglé le</th><th>Statut</th>{canEdit && <th className="no-print"></th>}</tr></thead>
            <tbody>
              {c.payments.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-slate-700">{p.reference}</td>
                  <td className="text-slate-600">{label(PAYMENT_TYPE_LABELS, p.type)}</td>
                  <td className="whitespace-nowrap">{formatFC(p.amountFC)}</td>
                  <td>{formatDate(p.dueDate)}</td>
                  <td>{formatDate(p.paidDate)}</td>
                  <td><PaymentStatusBadge value={p.status} /></td>
                  {canEdit && (
                    <td className="no-print text-right">
                      {p.status !== "PAYE" && (
                        <form action={markPaymentPaid.bind(null, p.id, c.id)}>
                          <Button type="submit" size="sm" variant="success"><Check className="h-3.5 w-3.5" /> Marquer payé</Button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section title="Réceptions & livraisons" count={c.receptions.length}>
        {c.receptions.length === 0 ? <EmptyState title="Aucune réception." /> : (
          <table className="data-table">
            <thead><tr><th>Type</th><th>Prévue</th><th>Constatée</th><th>Statut</th>{canEdit && <th className="no-print"></th>}</tr></thead>
            <tbody>
              {c.receptions.map((r) => (
                <tr key={r.id}>
                  <td className="text-slate-700">{label(RECEPTION_TYPE_LABELS, r.type)}</td>
                  <td>{formatDate(r.plannedDate)}</td>
                  <td>{formatDate(r.actualDate)}</td>
                  <td><ReceptionStatusBadge value={r.status} /></td>
                  {canEdit && (
                    <td className="no-print text-right">
                      {r.status !== "RECEPTIONNE" && (
                        <form action={markReceptionDone.bind(null, r.id, c.id)}>
                          <Button type="submit" size="sm" variant="success"><Check className="h-3.5 w-3.5" /> Constater</Button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section title="Pénalités" count={c.penalties.length}>
          {c.penalties.length === 0 ? <EmptyState title="Aucune pénalité." /> : (
            <ul className="divide-y divide-slate-50 text-sm">
              {c.penalties.map((p) => (
                <li key={p.id} className="px-4 py-2">
                  <div className="flex justify-between"><span className="text-slate-700">{p.reason}</span><span className="font-medium text-red-600">{formatFC(p.amountFC)}</span></div>
                  <p className="text-xs text-slate-400">{p.daysLate ?? 0} j de retard · {formatDate(p.appliedDate)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Avenants" count={c.amendments.length}>
          {c.amendments.length === 0 ? <EmptyState title="Aucun avenant." /> : (
            <ul className="divide-y divide-slate-50 text-sm">
              {c.amendments.map((a) => (
                <li key={a.id} className="px-4 py-2">
                  <div className="flex justify-between"><span className="text-slate-700">{a.reference} — {a.object}</span><Badge tone="slate">{label(AMENDMENT_STATUS_LABELS, a.status)}</Badge></div>
                  <p className="text-xs text-slate-400">
                    {a.amountDeltaFC ? `Δ ${formatFC(a.amountDeltaFC)} · ` : ""}
                    {a.newEndDate ? `nouvelle échéance ${formatDate(a.newEndDate)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Ordres de service" count={c.serviceOrders.length}>
          {c.serviceOrders.length === 0 ? <EmptyState title="Aucun ordre de service." /> : (
            <ul className="divide-y divide-slate-50 text-sm">
              {c.serviceOrders.map((o) => (
                <li key={o.id} className="px-4 py-2">
                  <div className="flex justify-between"><span className="text-slate-700">{o.reference}</span><span className="text-xs text-slate-500">{label(SERVICE_ORDER_TYPE_LABELS, o.type)}</span></div>
                  <p className="text-xs text-slate-400">{o.object} · {formatDate(o.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
