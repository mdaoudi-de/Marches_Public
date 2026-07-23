import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, ListTree, ScrollText, Network } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardBody } from "@/components/ui";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!can(user, "ADMIN", "view")) redirect("/dashboard");
  const isAdmin = can(user, "ADMIN", "admin");

  const [users, templates, logs, directions] = await Promise.all([
    prisma.user.count(),
    prisma.procedureTemplate.count(),
    prisma.auditLog.count(),
    prisma.direction.count(),
  ]);

  const cards = [
    { href: "/admin/users", icon: Users, title: "Utilisateurs & droits", desc: `${users} comptes — profils et niveaux d'accès`, show: true },
    { href: "/admin/directions", icon: Network, title: "Directions", desc: `${directions} directions — référentiel FONAREV`, show: true },
    { href: "/admin/templates", icon: ListTree, title: "Modèles de procédure", desc: `${templates} modèles — phases et étapes paramétrables`, show: true },
    { href: "/admin/journal", icon: ScrollText, title: "Journal d'audit", desc: `${logs} événements — traçabilité et export`, show: true },
  ];

  return (
    <>
      <PageHeader title="Administration" subtitle={isAdmin ? "Gestion des utilisateurs, du référentiel et de la traçabilité" : "Consultation (accès restreint)"} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => c.show).map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody>
                  <div className="mb-2 inline-flex rounded-lg bg-brand-50 p-2 text-brand-600"><Icon className="h-5 w-5" /></div>
                  <h3 className="font-semibold text-slate-800">{c.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{c.desc}</p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
