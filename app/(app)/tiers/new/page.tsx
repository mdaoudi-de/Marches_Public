import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, Field, Input, Select, Button } from "@/components/ui";
import { createProfile } from "@/actions/tiers";

export default async function NewTierPage() {
  const user = await getCurrentUser();
  if (!can(user, "TIERS", "edit")) redirect("/tiers");

  const suppliers = await prisma.supplier.findMany({
    where: { thirdPartyProfile: { is: null } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <div className="mb-3">
        <Link href="/tiers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Tiers & Due Diligence
        </Link>
      </div>
      <PageHeader title="Nouveau tiers" subtitle="Qualification 8.1 — l'identité numérique du tiers. Les pièces et le questionnaire sont ensuite renseignés sur la fiche." />

      <Card className="max-w-2xl">
        <CardBody>
          <form action={createProfile} className="space-y-4">
            <Field label="Fournisseur lié (optionnel)" hint="Relier ce tiers à un fournisseur existant, ou laisser vide pour un prospect.">
              <Select name="supplierId" defaultValue="">
                <option value="">— Aucun (prospect) —</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Dénomination sociale" htmlFor="denomination">
              <Input id="denomination" name="denomination" required placeholder="Ex. CONGO BÂTIR SARL" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="RCCM"><Input name="rccm" /></Field>
              <Field label="ID National"><Input name="idNational" /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="NIF"><Input name="nif" /></Field>
              <Field label="N° d'impôt"><Input name="taxNumber" /></Field>
            </div>
            <Field label="Adresse"><Input name="address" /></Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Province"><Input name="province" /></Field>
              <Field label="Ville"><Input name="city" /></Field>
              <Field label="Secteur d'activité"><Input name="sector" /></Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Link href="/tiers" className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</Link>
              <Button type="submit">Enregistrer le tiers</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
