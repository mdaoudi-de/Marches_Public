import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody, Badge } from "@/components/ui";
import { NatureBadge } from "@/components/badges";
import { PROCEDURE_LABELS, label } from "@/lib/enums";

export default async function AdminTemplatesPage() {
  const user = await getCurrentUser();
  if (!can(user, "ADMIN", "view")) redirect("/dashboard");

  const templates = await prisma.procedureTemplate.findMany({
    orderBy: [{ marketNature: "asc" }, { name: "asc" }],
    include: { phases: { orderBy: { order: "asc" }, include: { steps: { orderBy: { order: "asc" } } } } },
  });

  return (
    <>
      <div className="mb-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Administration</Link>
      </div>
      <PageHeader title="Modèles de procédure" subtitle={`${templates.length} modèles — phases et étapes paramétrables par type de procédure`} />

      <div className="space-y-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <CardBody>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <NatureBadge nature={t.marketNature} />
                <h3 className="font-semibold text-slate-800">{t.name}</h3>
                <Badge tone="slate">{label(PROCEDURE_LABELS, t.procedureType)}</Badge>
                {t.requiresPrequalification && <Badge tone="blue">pré-qualification</Badge>}
                {t.requiresRevuePrealable ? <Badge tone="violet">revue préalable</Badge> : <Badge tone="gray">sans revue préalable</Badge>}
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
                {t.phases.map((ph) => (
                  <div key={ph.id} className="rounded-md border border-slate-100 bg-slate-50/50 p-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{ph.name}</p>
                    <ol className="list-decimal space-y-0.5 pl-4 text-sm text-slate-600">
                      {ph.steps.map((s) => (
                        <li key={s.id}>
                          {s.name}
                          {s.stepKind === "MONTANT" && <Badge tone="amber" className="ml-1">montant</Badge>}
                          {s.requiresNonObjection && <Badge tone="violet" className="ml-1">NO</Badge>}
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
