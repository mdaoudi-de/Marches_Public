import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, Field, Input, Select, Button } from "@/components/ui";
import { SUPPLIER_TYPE_LABELS } from "@/lib/enums";
import { createSupplier } from "@/actions/fournisseurs";

export default async function NewSupplierPage() {
  const user = await getCurrentUser();
  if (!can(user, "FOURNISSEURS", "edit")) redirect("/fournisseurs");

  return (
    <>
      <div className="mb-3">
        <Link href="/fournisseurs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Fournisseurs
        </Link>
      </div>
      <PageHeader title="Nouveau fournisseur" />
      <Card className="max-w-2xl">
        <CardBody>
          <form action={createSupplier} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nom / Raison sociale" htmlFor="name"><Input id="name" name="name" required /></Field>
              <Field label="Type" htmlFor="type">
                <Select id="type" name="type" defaultValue="ENTREPRISE">
                  {Object.entries(SUPPLIER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RCCM" htmlFor="rccm"><Input id="rccm" name="rccm" /></Field>
              <Field label="NIF" htmlFor="nif"><Input id="nif" name="nif" /></Field>
            </div>
            <Field label="Adresse" htmlFor="address"><Input id="address" name="address" /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Ville" htmlFor="city"><Input id="city" name="city" /></Field>
              <Field label="Téléphone" htmlFor="phone"><Input id="phone" name="phone" /></Field>
              <Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" /></Field>
            </div>
            <Field label="Personne de contact" htmlFor="contactPerson"><Input id="contactPerson" name="contactPerson" /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/fournisseurs" className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</Link>
              <Button type="submit">Créer</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
