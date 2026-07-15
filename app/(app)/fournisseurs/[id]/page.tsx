import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { PageHeader, Card, CardHeader, CardBody, Badge, Field, Select, Textarea, Button, EmptyState } from "@/components/ui";
import { ScoreBadge, MarketStatusBadge } from "@/components/badges";
import { SUPPLIER_TYPE_LABELS, CONTRACT_TYPE_LABELS, label } from "@/lib/enums";
import { formatFC, formatDate } from "@/lib/utils";
import { addEvaluation } from "@/actions/fournisseurs";

export default async function FournisseurDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const canEdit = can(user, "FOURNISSEURS", "edit");

  const s = await prisma.supplier.findUnique({
    where: { id: Number(id) },
    include: {
      markets: { orderBy: { reference: "asc" } },
      contracts: { include: { market: { select: { reference: true } } }, orderBy: { signatureDate: "desc" } },
      evaluations: { include: { market: { select: { reference: true } }, evaluator: { select: { fullName: true } } }, orderBy: { evaluatedAt: "desc" } },
    },
  });
  if (!s) notFound();

  const avg = s.evaluations.length ? s.evaluations.reduce((a, e) => a + e.globalScore, 0) / s.evaluations.length : null;
  const coords: [string, string | null][] = [
    ["RCCM", s.rccm], ["NIF", s.nif], ["Adresse", s.address], ["Ville", s.city],
    ["Téléphone", s.phone], ["Email", s.email], ["Contact", s.contactPerson],
  ];

  return (
    <>
      <div className="mb-3">
        <Link href="/fournisseurs" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Fournisseurs
        </Link>
      </div>
      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{s.name} <Badge tone="slate">{label(SUPPLIER_TYPE_LABELS, s.type)}</Badge></span>}
        subtitle={<span className="flex items-center gap-2"><Star className="h-4 w-4 text-amber-400" /> Note moyenne : <ScoreBadge value={avg} /> ({s.evaluations.length} évaluation(s))</span>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Coordonnées" />
          <CardBody className="space-y-1.5">
            {coords.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-slate-50 py-1 text-sm">
                <span className="text-slate-500">{k}</span><span className="text-right font-medium text-slate-700">{v || "—"}</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Historique — marchés & contrats" />
          <CardBody className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Marchés attribués</p>
              {s.markets.length === 0 ? <p className="text-sm text-slate-400">Aucun.</p> : (
                <ul className="space-y-1">
                  {s.markets.map((m) => (
                    <li key={m.id} className="flex items-center justify-between text-sm">
                      <Link href={`/ppm/${m.id}`} className="text-brand-700 hover:underline">{m.reference} — {m.intitule}</Link>
                      <MarketStatusBadge value={m.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Contrats</p>
              {s.contracts.length === 0 ? <p className="text-sm text-slate-400">Aucun.</p> : (
                <ul className="space-y-1">
                  {s.contracts.map((c) => (
                    <li key={c.id} className="flex items-center justify-between text-sm">
                      <Link href={`/contrats/${c.id}`} className="text-brand-700 hover:underline">{c.reference}</Link>
                      <span className="text-slate-500">{label(CONTRACT_TYPE_LABELS, c.type)} · {formatFC(c.amountFC)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Évaluations de performance" subtitle="qualité · délais · conformité · satisfaction" />
          <CardBody>
            {s.evaluations.length === 0 ? <EmptyState title="Aucune évaluation." /> : (
              <div className="space-y-3">
                {s.evaluations.map((e) => (
                  <div key={e.id} className="rounded-md border border-slate-100 p-3">
                    <div className="flex items-center justify-between">
                      <ScoreBadge value={e.globalScore} />
                      <span className="text-xs text-slate-400">{e.market?.reference ?? "—"} · {e.evaluator.fullName} · {formatDate(e.evaluatedAt)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                      <Badge tone="slate">Qualité {e.qualityScore}/5</Badge>
                      <Badge tone="slate">Délais {e.deadlineScore}/5</Badge>
                      <Badge tone="slate">Conformité {e.conformityScore}/5</Badge>
                      <Badge tone="slate">Satisfaction {e.satisfactionScore}/5</Badge>
                    </div>
                    {e.comment && <p className="mt-2 text-sm text-slate-600">« {e.comment} »</p>}
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {canEdit && (
          <Card>
            <CardHeader title="Nouvelle évaluation" />
            <CardBody>
              <form action={addEvaluation} className="space-y-3">
                <input type="hidden" name="supplierId" value={s.id} />
                <Field label="Marché concerné">
                  <Select name="marketId" defaultValue="">
                    <option value="">— Aucun —</option>
                    {s.markets.map((m) => <option key={m.id} value={m.id}>{m.reference}</option>)}
                  </Select>
                </Field>
                {[
                  ["qualityScore", "Qualité des prestations"],
                  ["deadlineScore", "Respect des délais"],
                  ["conformityScore", "Conformité des livraisons"],
                  ["satisfactionScore", "Satisfaction globale"],
                ].map(([name, lbl]) => (
                  <Field key={name} label={lbl}>
                    <Select name={name} defaultValue="4">
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
                    </Select>
                  </Field>
                ))}
                <Field label="Commentaire">
                  <Textarea name="comment" placeholder="Observations…" />
                </Field>
                <Button type="submit" className="w-full">Enregistrer l'évaluation</Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
