import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, Field, Input, Textarea, Button } from "@/components/ui";
import { PURCHASE_THRESHOLD_USD } from "@/lib/config";
import { formatFC } from "@/lib/utils";
import { createPurchaseRequest } from "@/actions/achats";

export default async function NewPurchaseRequestPage() {
  const user = await getCurrentUser();
  if (!can(user, "ACHATS", "edit")) redirect("/achats");

  return (
    <>
      <div className="mb-3">
        <Link href="/achats" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Achats
        </Link>
      </div>
      <PageHeader title="Nouvelle demande d'achat" subtitle={`Pour un montant inférieur au seuil réglementaire (${formatFC(PURCHASE_THRESHOLD_USD)}).`} />
      <Card className="max-w-xl">
        <CardBody>
          <form action={createPurchaseRequest} className="space-y-4">
            <Field label="Objet de la demande" htmlFor="description">
              <Textarea id="description" name="description" required placeholder="Ex. Fournitures de papeterie pour le 3e trimestre" />
            </Field>
            <Field label="Montant estimé (USD)" htmlFor="estimatedAmountFC">
              <Input id="estimatedAmountFC" name="estimatedAmountFC" type="number" min="0" required placeholder="Ex. 2500000" />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/achats" className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</Link>
              <Button type="submit">Créer la demande</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
