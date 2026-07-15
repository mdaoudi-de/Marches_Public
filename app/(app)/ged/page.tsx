import Link from "next/link";
import { Download, Upload, Archive, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, Badge, EmptyState, Field, Input, Select, Button } from "@/components/ui";
import { DOC_CATEGORY_LABELS, label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { uploadDocument, archiveDocument } from "@/actions/ged";

function formatBytes(b: number) {
  if (b < 1024) return `${b} o`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} Ko`;
  return `${(b / 1024 / 1024).toFixed(1)} Mo`;
}

export default async function GedPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; market?: string; show?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const canEdit = can(user, "GED", "edit");
  const showAll = sp.show === "all";

  const where: Record<string, unknown> = {};
  if (!showAll) where.archived = false;
  if (sp.category) where.category = sp.category;
  if (sp.market) where.marketId = Number(sp.market);
  if (sp.q) where.title = { contains: sp.q };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    include: { market: { select: { reference: true } }, uploadedBy: { select: { fullName: true } } },
  });
  const markets = await prisma.market.findMany({ select: { id: true, reference: true }, orderBy: { reference: "asc" } });
  const currentDocs = await prisma.document.findMany({ where: { isCurrentVersion: true }, select: { id: true, title: true, version: true }, orderBy: { title: "asc" } });

  return (
    <>
      <PageHeader title="Gestion documentaire (GED)" subtitle={`${documents.length} document(s) — dossier électronique par marché, versions, recherche multicritère`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Recherche multicritère */}
          <Card className="mb-4 p-3">
            <form method="get" className="flex flex-wrap items-end gap-3 text-sm">
              <label className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-slate-500">Titre</span>
                <input name="q" defaultValue={sp.q ?? ""} placeholder="Rechercher…" className="w-48 rounded-md border border-slate-300 px-3 py-1.5" />
              </label>
              <label className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-slate-500">Catégorie</span>
                <select name="category" defaultValue={sp.category ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
                  <option value="">Toutes</option>
                  {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label className="flex flex-col">
                <span className="mb-1 text-xs font-medium text-slate-500">Marché</span>
                <select name="market" defaultValue={sp.market ?? ""} className="rounded-md border border-slate-300 px-3 py-1.5">
                  <option value="">Tous</option>
                  {markets.map((m) => <option key={m.id} value={m.id}>{m.reference}</option>)}
                </select>
              </label>
              <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white hover:bg-brand-700">Filtrer</button>
              <Link href="/ged" className="px-2 py-1.5 text-slate-500 hover:underline">Réinitialiser</Link>
              <Link href={showAll ? "/ged" : "/ged?show=all"} className="px-2 py-1.5 text-slate-500 hover:underline">
                {showAll ? "Masquer archivés" : "Inclure archivés"}
              </Link>
            </form>
          </Card>

          {documents.length === 0 ? (
            <EmptyState title="Aucun document." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="data-table">
                <thead><tr><th>Document</th><th>Catégorie</th><th>Marché</th><th>Ver.</th><th>Taille</th><th>Importé</th><th className="no-print"></th></tr></thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className={doc.archived ? "opacity-60" : ""}>
                      <td>
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-700">{doc.title}</span>
                          {doc.archived && <Badge tone="gray">archivé</Badge>}
                        </span>
                      </td>
                      <td><Badge tone="slate">{label(DOC_CATEGORY_LABELS, doc.category)}</Badge></td>
                      <td className="text-slate-600">{doc.market?.reference ?? "—"}</td>
                      <td>{doc.version > 1 ? <Badge tone="violet">v{doc.version}</Badge> : `v${doc.version}`}</td>
                      <td className="whitespace-nowrap text-slate-500">{formatBytes(doc.sizeBytes)}</td>
                      <td className="whitespace-nowrap text-xs text-slate-400">{doc.uploadedBy.fullName}<br />{formatDate(doc.uploadedAt)}</td>
                      <td className="no-print text-right">
                        <div className="flex justify-end gap-1">
                          <a href={`/api/documents/${doc.id}`} target="_blank" rel="noreferrer" className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                            <Download className="inline h-3.5 w-3.5" /> Ouvrir
                          </a>
                          {canEdit && !doc.archived && (
                            <form action={archiveDocument.bind(null, doc.id)}>
                              <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"><Archive className="inline h-3.5 w-3.5" /></button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {canEdit && (
          <Card className="h-fit">
            <CardHeader title={<span className="flex items-center gap-2"><Upload className="h-4 w-4" /> Importer un document</span>} />
            <CardBody>
              <form action={uploadDocument} className="space-y-3">
                <Field label="Titre"><Input name="title" required placeholder="Ex. PV d'ouverture des offres" /></Field>
                <Field label="Catégorie">
                  <Select name="category" defaultValue="AUTRE">
                    {Object.entries(DOC_CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Marché associé">
                  <Select name="marketId" defaultValue="">
                    <option value="">— Aucun —</option>
                    {markets.map((m) => <option key={m.id} value={m.id}>{m.reference}</option>)}
                  </Select>
                </Field>
                <Field label="Nouvelle version de (optionnel)" hint="Chaîne les versions du document.">
                  <Select name="replacesDocumentId" defaultValue="">
                    <option value="">— Nouveau document —</option>
                    {currentDocs.map((dd) => <option key={dd.id} value={dd.id}>{dd.title} (v{dd.version})</option>)}
                  </Select>
                </Field>
                <Field label="Fichier"><input type="file" name="file" required className="w-full text-sm" /></Field>
                <Button type="submit" className="w-full">Importer</Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
