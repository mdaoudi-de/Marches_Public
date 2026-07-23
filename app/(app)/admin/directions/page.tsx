import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, Badge, Field, Input, Button, EmptyState } from "@/components/ui";
import { createDirection, toggleDirection } from "@/actions/admin";

export default async function AdminDirectionsPage() {
  const me = await getCurrentUser();
  if (!can(me, "ADMIN", "admin")) redirect("/admin");

  const directions = await prisma.direction.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { markets: true } } },
  });

  return (
    <>
      <div className="mb-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Administration</Link>
      </div>
      <PageHeader title="Directions" subtitle="Référentiel des directions de l'autorité contractante (FONAREV)" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {directions.length === 0 ? (
            <EmptyState title="Aucune direction." hint="Créez la première direction." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="data-table">
                <thead><tr><th>Code</th><th>Direction</th><th>Marchés</th><th>Statut</th><th className="no-print"></th></tr></thead>
                <tbody>
                  {directions.map((dr) => (
                    <tr key={dr.id}>
                      <td className="font-mono text-slate-600">{dr.code}</td>
                      <td className="font-medium text-slate-800">{dr.name}</td>
                      <td>{dr._count.markets}</td>
                      <td>{dr.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>}</td>
                      <td className="no-print text-right">
                        <form action={toggleDirection.bind(null, dr.id, !dr.active)}>
                          <Button type="submit" size="sm" variant="outline">{dr.active ? "Désactiver" : "Activer"}</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader title="Nouvelle direction" />
          <CardBody>
            <form action={createDirection} className="space-y-3">
              <Field label="Code" hint="Ex. DIR_FIN (majuscules)."><Input name="code" required placeholder="DIR_FIN" /></Field>
              <Field label="Nom"><Input name="name" required placeholder="Direction Financière" /></Field>
              <Button type="submit" className="w-full">Créer</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
