import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, Field, Input, Select, Button } from "@/components/ui";
import { NATURE_LABELS, label } from "@/lib/enums";
import { createMarket } from "@/actions/ppm";
import { TODAY_ISO } from "@/lib/config";

export default async function NewMarketPage() {
  const user = await getCurrentUser();
  if (!can(user, "PPM", "edit")) redirect("/ppm");

  const templates = await prisma.procedureTemplate.findMany({ where: { active: true }, orderBy: [{ marketNature: "asc" }, { name: "asc" }] });

  return (
    <>
      <div className="mb-3">
        <Link href="/ppm" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Plan de passation
        </Link>
      </div>
      <PageHeader title="Nouveau marché" subtitle="La référence est générée automatiquement ; les étapes sont créées à partir du modèle de procédure choisi." />

      <Card className="max-w-2xl">
        <CardBody>
          <form action={createMarket} className="space-y-4">
            <Field label="Intitulé du marché" htmlFor="intitule">
              <Input id="intitule" name="intitule" required placeholder="Ex. Construction d'un bâtiment administratif" />
            </Field>

            <Field label="Modèle de procédure" htmlFor="templateId" hint="Détermine la nature, la procédure et le jeu d'étapes (phases).">
              <Select id="templateId" name="templateId" required defaultValue="">
                <option value="" disabled>— Choisir un modèle —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{label(NATURE_LABELS, t.marketNature)}] {t.name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Budget prévisionnel (FC)" htmlFor="budgetAmountFC">
                <Input id="budgetAmountFC" name="budgetAmountFC" type="number" min="0" required placeholder="Ex. 500000000" />
              </Field>
              <Field label="Code budgétaire" htmlFor="budgetCode">
                <Input id="budgetCode" name="budgetCode" placeholder="Optionnel" />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="N° d'appel d'offres" htmlFor="aoNumber">
                <Input id="aoNumber" name="aoNumber" placeholder="Optionnel" />
              </Field>
              <Field label="Exercice budgétaire" htmlFor="fiscalYear">
                <Input id="fiscalYear" name="fiscalYear" type="number" defaultValue={2026} required />
              </Field>
              <Field label="Démarrage prévisionnel" htmlFor="startDate" hint="Point de départ des prévisions.">
                <Input id="startDate" name="startDate" type="date" defaultValue={TODAY_ISO} />
              </Field>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/ppm" className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Annuler</Link>
              <Button type="submit">Créer le marché</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}
