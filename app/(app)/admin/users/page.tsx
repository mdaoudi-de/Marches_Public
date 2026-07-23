import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can, RBAC_MATRIX, ACCESS_LEVEL_LABELS } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, Badge, Field, Input, Select, Button } from "@/components/ui";
import { ROLE_LABELS, label } from "@/lib/enums";
import { formatDateTime } from "@/lib/utils";
import { createUser, toggleUserActive } from "@/actions/admin";
import type { Role, AppModule } from "@/lib/enums";

const MODULES: AppModule[] = ["PPM", "PASSATION", "CONTRATS", "ACHATS", "FOURNISSEURS", "TIERS", "GED", "ALERTES", "ADMIN"];

export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  if (!can(me, "ADMIN", "admin")) redirect("/admin");

  const users = await prisma.user.findMany({ orderBy: { id: "asc" } });

  return (
    <>
      <div className="mb-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Administration</Link>
      </div>
      <PageHeader title="Utilisateurs & droits" subtitle="Authentification par identifiant / mot de passe · 4 niveaux d'accès différenciés" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="data-table">
              <thead><tr><th>Utilisateur</th><th>Identifiant</th><th>Profil</th><th>Statut</th><th>Dernière connexion</th><th className="no-print"></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><span className="font-medium text-slate-800">{u.fullName}</span><div className="text-xs text-slate-400">{u.email}</div></td>
                    <td className="font-mono text-slate-600">{u.username}</td>
                    <td><Badge tone="slate">{label(ROLE_LABELS, u.role)}</Badge></td>
                    <td>{u.active ? <Badge tone="green">Actif</Badge> : <Badge tone="red">Inactif</Badge>}</td>
                    <td className="text-xs text-slate-400">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—"}</td>
                    <td className="no-print text-right">
                      {u.id !== me!.id && (
                        <form action={toggleUserActive.bind(null, u.id, !u.active)}>
                          <Button type="submit" size="sm" variant="outline">{u.active ? "Désactiver" : "Activer"}</Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Matrice RBAC */}
          <Card>
            <CardHeader title="Matrice des droits (rôle × module)" subtitle="consultation < utilisateur < validateur < administrateur" />
            <CardBody className="p-0 overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Profil</th>{MODULES.map((m) => <th key={m}>{m}</th>)}</tr></thead>
                <tbody>
                  {(Object.keys(RBAC_MATRIX) as Role[]).map((role) => (
                    <tr key={role}>
                      <td className="font-medium text-slate-700">{label(ROLE_LABELS, role)}</td>
                      {MODULES.map((m) => {
                        const lvl = RBAC_MATRIX[role][m];
                        const tone = lvl === "admin" ? "violet" : lvl === "validate" ? "blue" : lvl === "edit" ? "green" : lvl === "view" ? "slate" : "gray";
                        return <td key={m}><Badge tone={tone}>{ACCESS_LEVEL_LABELS[lvl]}</Badge></td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader title="Nouvel utilisateur" />
          <CardBody>
            <form action={createUser} className="space-y-3">
              <Field label="Nom complet"><Input name="fullName" required /></Field>
              <Field label="Identifiant"><Input name="username" required /></Field>
              <Field label="Email"><Input name="email" type="email" required /></Field>
              <Field label="Profil">
                <Select name="role" defaultValue="RESP_PREPARATION">
                  {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
              <Field label="Mot de passe"><Input name="password" type="password" required /></Field>
              <Button type="submit" className="w-full">Créer l'utilisateur</Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
