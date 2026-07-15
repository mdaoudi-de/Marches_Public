import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, LinkButton, Badge, EmptyState } from "@/components/ui";
import { AUDIT_ACTION_LABELS, label } from "@/lib/enums";
import { formatDateTime } from "@/lib/utils";
import type { Tone } from "@/components/ui-types";

const ACTION_TONE: Record<string, Tone> = {
  LOGIN: "slate", LOGOUT: "gray", CREATE: "green", UPDATE: "blue",
  DELETE: "red", VALIDATE: "violet", EXPORT: "amber", UPLOAD: "blue",
};

export default async function AdminJournalPage({ searchParams }: { searchParams: Promise<{ action?: string; module?: string; q?: string }> }) {
  const user = await getCurrentUser();
  if (!can(user, "ADMIN", "view")) redirect("/dashboard");
  const sp = await searchParams;

  const where: Record<string, unknown> = {};
  if (sp.action) where.action = sp.action;
  if (sp.module) where.module = sp.module;
  if (sp.q) where.detail = { contains: sp.q };

  const logs = await prisma.auditLog.findMany({
    where, orderBy: { createdAt: "desc" }, take: 300,
    include: { user: { select: { fullName: true } } },
  });
  const modules = [...new Set((await prisma.auditLog.findMany({ select: { module: true } })).map((l) => l.module))];

  return (
    <>
      <div className="mb-3">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline"><ArrowLeft className="h-3.5 w-3.5" /> Administration</Link>
      </div>
      <PageHeader
        title="Journal d'audit"
        subtitle="Traçabilité complète des connexions et actions"
        actions={<LinkButton href="/api/export/journal" variant="outline"><Download className="h-4 w-4" /> Export Excel</LinkButton>}
      />

      <Card className="mb-4 p-3">
        <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Recherche</span>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="Détail…" className="w-48 rounded-md border border-slate-300 px-3 py-1.5" />
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Action</span>
            <select name="action" defaultValue={sp.action ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Toutes</option>
              {Object.entries(AUDIT_ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="flex flex-col">
            <span className="mb-1 text-xs font-medium text-slate-500">Module</span>
            <select name="module" defaultValue={sp.module ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
              <option value="">Tous</option>
              {modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700">Filtrer</button>
          <Link href="/admin/journal" className="px-2 py-1.5 text-slate-500 hover:underline">Réinitialiser</Link>
        </form>
      </Card>

      {logs.length === 0 ? (
        <EmptyState title="Aucun événement." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="data-table">
            <thead><tr><th>Date & heure</th><th>Utilisateur</th><th>Action</th><th>Module</th><th>Détail</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-slate-500">{formatDateTime(l.createdAt)}</td>
                  <td className="text-slate-700">{l.user?.fullName ?? "Système"}</td>
                  <td><Badge tone={ACTION_TONE[l.action] ?? "slate"}>{label(AUDIT_ACTION_LABELS, l.action)}</Badge></td>
                  <td className="text-slate-500">{l.module}</td>
                  <td className="text-slate-600">{l.detail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
