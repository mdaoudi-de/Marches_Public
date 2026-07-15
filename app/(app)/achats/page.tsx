import Link from "next/link";
import { Plus, Check, X, Package, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, LinkButton, EmptyState, Button, Card, CardBody } from "@/components/ui";
import { PRStatusBadge } from "@/components/badges";
import { PURCHASE_THRESHOLD_FC } from "@/lib/config";
import { formatFC, formatDate } from "@/lib/utils";
import { advancePurchaseRequest } from "@/actions/achats";

export default async function AchatsPage() {
  const user = await getCurrentUser();
  const canEdit = can(user, "ACHATS", "edit");

  const requests = await prisma.purchaseRequest.findMany({
    orderBy: { reference: "desc" },
    include: { requester: { select: { fullName: true } }, supplier: { select: { name: true } } },
  });

  return (
    <>
      <PageHeader
        title="Achats sous seuil"
        subtitle={`Demandes d'achat sous le seuil réglementaire (${formatFC(PURCHASE_THRESHOLD_FC)})`}
        actions={canEdit && <LinkButton href="/achats/new"><Plus className="h-4 w-4" /> Nouvelle demande</LinkButton>}
      />

      <Card className="mb-4">
        <CardBody className="text-sm text-slate-500">
          Circuit : <b>Demande</b> → <b>Approuvée</b> → <b>Commandée</b> → <b>Payée</b> (ou <b>Rejetée</b>).
        </CardBody>
      </Card>

      {requests.length === 0 ? (
        <EmptyState title="Aucune demande d'achat." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead>
              <tr>
                <th>Référence</th><th>Objet</th><th>Montant estimé</th><th>Demandeur</th>
                <th>Fournisseur</th><th>Statut</th>{canEdit && <th className="no-print">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-slate-700">{r.reference}</td>
                  <td className="max-w-xs text-slate-700">{r.description}<div className="text-xs text-slate-400">{formatDate(r.requestDate)}</div></td>
                  <td className="whitespace-nowrap">{formatFC(r.estimatedAmountFC)}</td>
                  <td className="text-slate-600">{r.requester.fullName}</td>
                  <td className="text-slate-600">{r.supplier?.name ?? "—"}</td>
                  <td><PRStatusBadge value={r.status} /></td>
                  {canEdit && (
                    <td className="no-print">
                      <div className="flex flex-wrap gap-1">
                        {r.status === "DEMANDE" && (
                          <>
                            <form action={advancePurchaseRequest.bind(null, r.id, "APPROUVEE")}><Button type="submit" size="sm" variant="success"><Check className="h-3.5 w-3.5" /> Approuver</Button></form>
                            <form action={advancePurchaseRequest.bind(null, r.id, "REJETEE")}><Button type="submit" size="sm" variant="outline"><X className="h-3.5 w-3.5" /> Rejeter</Button></form>
                          </>
                        )}
                        {r.status === "APPROUVEE" && (
                          <form action={advancePurchaseRequest.bind(null, r.id, "COMMANDEE")}><Button type="submit" size="sm" variant="secondary"><Package className="h-3.5 w-3.5" /> Commander</Button></form>
                        )}
                        {r.status === "COMMANDEE" && (
                          <form action={advancePurchaseRequest.bind(null, r.id, "PAYEE")}><Button type="submit" size="sm" variant="success"><Wallet className="h-3.5 w-3.5" /> Payer</Button></form>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
