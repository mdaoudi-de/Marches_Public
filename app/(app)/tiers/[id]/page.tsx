import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RefreshCw, ShieldCheck, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/rbac";
import {
  PageHeader, Card, CardHeader, CardBody, StatCard, Badge, Button, Field, Input, Select, Textarea, Progress, EmptyState,
} from "@/components/ui";
import { RiskBadge, DecisionBadge, DocControlBadge, StageBadge } from "@/components/badges";
import {
  TP_DOC_ORDER, TP_DOC_LABELS, DD_ORDER, DD_QUESTION_LABELS, DD_RISKY_ANSWER, INVESTIGATION_ORDER, INVESTIGATION_LABELS,
  CONTROL_ORDER, CONTROL_LABELS, RUBRIC_ORDER, RUBRIC_LABELS, REPRESENTATIVE_ROLE_LABELS, MONITORING_LABELS,
  RISK_LEVEL_TONE, ANSWER_LABELS, label,
} from "@/lib/enums";
import type { Tone } from "@/components/ui-types";
import { formatDate, toDateInput } from "@/lib/utils";
import {
  updateQualification, addRepresentative, addShareholder, upsertDocument, saveAnswer,
  upsertInvestigation, toggleControl, addMonitoringEvent, resolveMonitoringEvent, rescoreProfile, recordDecision,
} from "@/actions/tiers";

function ord<T>(arr: T[], list: readonly string[], key: (x: T) => string) {
  return [...arr].sort((a, b) => list.indexOf(key(a)) - list.indexOf(key(b)));
}

export default async function TierDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const canEdit = can(user, "TIERS", "edit");
  const canValidate = can(user, "TIERS", "validate");
  const pid = Number(id);

  const p = await prisma.thirdPartyProfile.findUnique({
    where: { id: pid },
    include: {
      supplier: {
        select: {
          id: true, name: true,
          _count: { select: { markets: true, contracts: true } },
          evaluations: { select: { globalScore: true } },
          markets: { select: { status: true } },
        },
      },
      representatives: true, shareholders: true, documents: true, answers: true,
      investigations: true, rubrics: true, controls: true,
      events: { orderBy: { detectedAt: "desc" } },
    },
  });
  if (!p) notFound();

  const docs = ord(p.documents, TP_DOC_ORDER, (d) => d.docType);
  const answers = ord(p.answers, DD_ORDER, (a) => a.questionKey);
  const invs = ord(p.investigations, INVESTIGATION_ORDER, (i) => i.itemKey);
  const rubrics = ord(p.rubrics, RUBRIC_ORDER, (r) => r.rubricKey);
  const controls = ord(p.controls, CONTROL_ORDER, (c) => c.controlKey);
  const riskTone: Tone = p.riskLevel ? RISK_LEVEL_TONE[p.riskLevel as keyof typeof RISK_LEVEL_TONE] : "gray";
  const showInvestigation = p.riskLevel === "ELEVE" || p.riskLevel === "CRITIQUE";

  const evals = p.supplier?.evaluations ?? [];
  const avgEval = evals.length ? (evals.reduce((s, e) => s + e.globalScore, 0) / evals.length) : null;
  const nbResiliations = (p.supplier?.markets ?? []).filter((m) => m.status === "RESILIE").length;

  return (
    <>
      <div className="mb-3">
        <Link href="/tiers" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Tiers & Due Diligence
        </Link>
      </div>

      <PageHeader
        title={<span className="flex flex-wrap items-center gap-3">{p.denomination} {p.riskLevel && <RiskBadge value={p.riskLevel} />} {p.decision && <DecisionBadge value={p.decision} />}</span>}
        subtitle={<span className="flex items-center gap-2"><StageBadge value={p.stage} /> {p.supplier && <>· fournisseur <Link href={`/fournisseurs/${p.supplier.id}`} className="text-brand-700 hover:underline">{p.supplier.name}</Link></>}</span>}
        actions={canEdit && (
          <form action={rescoreProfile.bind(null, p.id)}>
            <Button type="submit" variant="outline"><RefreshCw className="h-4 w-4" /> Recalculer le score</Button>
          </form>
        )}
      />

      {/* 8.6 Scoring — synthèse */}
      <Card className="mb-4">
        <CardBody>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <p className="text-sm font-medium text-slate-500">Score de risque</p>
              <p className="mt-1 text-4xl font-bold text-slate-900">{p.riskScore != null ? Math.round(p.riskScore) : "—"}<span className="text-lg text-slate-400">/100</span></p>
              <div className="mt-2"><Progress value={p.riskScore ?? 0} tone={riskTone} /></div>
              <p className="mt-3 text-sm text-slate-600">{p.recommendation ?? "Non évalué."}</p>
              {p.mitigation && <p className="mt-2 text-xs text-slate-500">Mesures : {p.mitigation}</p>}
            </div>
            <div className="lg:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-500">Rubriques pondérées (8.6)</p>
              <div className="space-y-1.5">
                {rubrics.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 text-sm">
                    <span className="w-48 shrink-0 text-slate-600">{label(RUBRIC_LABELS, r.rubricKey)}</span>
                    <span className="w-10 shrink-0 text-xs text-slate-400">{r.weightPct}%</span>
                    <div className="flex-1"><Progress value={r.riskScore} tone={r.riskScore < 25 ? "green" : r.riskScore < 50 ? "amber" : "red"} /></div>
                    <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-600">{Math.round(r.riskScore)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 7 points de contrôle interne */}
      <Card className="mb-4">
        <CardHeader title="Points de contrôle interne" subtitle="7 critères d'évaluation interne du tiers (feedback FONAREV)" />
        <CardBody className="space-y-2">
          {controls.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 border-b border-slate-50 py-1.5 text-sm last:border-0">
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{c.controlKey}</span>
                <span className="text-slate-700">{label(CONTROL_LABELS, c.controlKey)}</span>
                {!c.computed && <Badge tone="slate">manuel</Badge>}
              </span>
              <span className="flex items-center gap-2">
                {c.triggered ? <Badge tone="red">Déclenché</Badge> : <Badge tone="green">Conforme</Badge>}
                {canEdit && !c.computed && (
                  <form action={toggleControl.bind(null, p.id, c.controlKey, !c.triggered)}>
                    <Button type="submit" size="sm" variant="ghost">{c.triggered ? "Lever" : "Signaler"}</Button>
                  </form>
                )}
              </span>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 8.1 Qualification */}
        <Card>
          <CardHeader title="8.1 — Qualification" subtitle="Identité numérique du tiers" />
          <CardBody>
            <form action={updateQualification.bind(null, p.id)} className="space-y-3">
              <Field label="Dénomination sociale"><Input name="denomination" defaultValue={p.denomination} required /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="RCCM"><Input name="rccm" defaultValue={p.rccm ?? ""} /></Field>
                <Field label="ID National"><Input name="idNational" defaultValue={p.idNational ?? ""} /></Field>
                <Field label="NIF"><Input name="nif" defaultValue={p.nif ?? ""} /></Field>
                <Field label="N° d'impôt"><Input name="taxNumber" defaultValue={p.taxNumber ?? ""} /></Field>
                <Field label="Adresse"><Input name="address" defaultValue={p.address ?? ""} /></Field>
                <Field label="Ville"><Input name="city" defaultValue={p.city ?? ""} /></Field>
                <Field label="Province"><Input name="province" defaultValue={p.province ?? ""} /></Field>
                <Field label="Date de création"><Input type="date" name="creationDate" defaultValue={toDateInput(p.creationDate)} /></Field>
                <Field label="Secteur"><Input name="sector" defaultValue={p.sector ?? ""} /></Field>
                <Field label="Années d'expérience"><Input type="number" name="experienceYrs" defaultValue={p.experienceYrs ?? ""} /></Field>
                <Field label="Téléphone"><Input name="phone" defaultValue={p.phone ?? ""} /></Field>
                <Field label="Email"><Input name="email" defaultValue={p.email ?? ""} /></Field>
              </div>
              {canEdit && <Button type="submit" size="sm">Enregistrer la qualification</Button>}
            </form>

            {/* Représentants */}
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Représentants</p>
              {p.representatives.length === 0 ? <p className="text-sm text-slate-400">Aucun représentant.</p> : (
                <ul className="mb-2 space-y-1 text-sm">
                  {p.representatives.map((r) => (
                    <li key={r.id} className="flex justify-between"><span className="text-slate-700">{r.fullName}</span><Badge tone="slate">{label(REPRESENTATIVE_ROLE_LABELS, r.role)}</Badge></li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <form action={addRepresentative.bind(null, p.id)} className="flex flex-wrap items-end gap-2">
                  <Input name="fullName" placeholder="Nom du représentant" className="w-44" required />
                  <Select name="role" defaultValue="GERANT" className="w-40">
                    {Object.entries(REPRESENTATIVE_ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                  <Button type="submit" size="sm" variant="outline">Ajouter</Button>
                </form>
              )}
            </div>

            {/* Actionnariat */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Actionnariat & bénéficiaires effectifs</p>
              {p.shareholders.length === 0 ? <p className="text-sm text-slate-400">Aucun actionnaire.</p> : (
                <ul className="mb-2 space-y-1 text-sm">
                  {p.shareholders.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span className="text-slate-700">{s.name} {s.isBeneficialOwner && <Badge tone="violet">BE</Badge>}</span>
                      <span className="text-slate-500">{s.sharePct}%</span>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <form action={addShareholder.bind(null, p.id)} className="flex flex-wrap items-end gap-2">
                  <Input name="name" placeholder="Actionnaire" className="w-40" required />
                  <Input type="number" name="sharePct" placeholder="%" className="w-16" />
                  <label className="flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" name="isBeneficialOwner" /> BE</label>
                  <Button type="submit" size="sm" variant="outline">Ajouter</Button>
                </form>
              )}
            </div>
          </CardBody>
        </Card>

        {/* 8.2 Collecte documentaire */}
        <Card>
          <CardHeader title="8.2 — Collecte documentaire" subtitle="Pièces obligatoires & contrôles automatiques" />
          <CardBody className="p-0">
            <table className="data-table">
              <thead><tr><th>Pièce</th><th>Fournie</th><th>Expiration</th><th>Contrôle</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id}>
                    <td className="text-slate-700">{label(TP_DOC_LABELS, d.docType)}</td>
                    {canEdit ? (
                      <td colSpan={2}>
                        <form action={upsertDocument.bind(null, p.id)} className="flex items-center gap-2">
                          <input type="hidden" name="docType" value={d.docType} />
                          <label className="flex items-center gap-1 text-xs"><input type="checkbox" name="provided" defaultChecked={d.provided} /> oui</label>
                          <input type="date" name="expiryDate" defaultValue={toDateInput(d.expiryDate)} className="rounded border border-slate-300 px-1.5 py-1 text-xs" />
                          <Button type="submit" size="sm" variant="outline">OK</Button>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td>{d.provided ? "Oui" : "Non"}</td>
                        <td>{formatDate(d.expiryDate)}</td>
                      </>
                    )}
                    <td><DocControlBadge value={d.controlStatus} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        {/* 8.3 Screening */}
        <Card>
          <CardHeader title="8.3 — Screening" subtitle="Sources internes (calculées) & externes" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Marchés" value={p.supplier?._count.markets ?? 0} tone="blue" />
              <StatCard label="Résiliations" value={nbResiliations} tone={nbResiliations ? "red" : "green"} />
              <StatCard label="Contrats" value={p.supplier?._count.contracts ?? 0} tone="slate" />
              <StatCard label="Note moyenne" value={avgEval == null ? "—" : `${avgEval.toFixed(1)}/5`} tone={avgEval != null && avgEval < 2.5 ? "red" : "green"} />
            </div>
            <p className="mt-4 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Sources externes (intégration progressive)</p>
            <div className="flex flex-wrap gap-1.5">
              {["ONU", "OFAC", "Union Européenne", "Banque Mondiale", "GUCE", "DGI", "CNSS", "ARMP", "OSINT"].map((s) => (
                <Badge key={s} tone="gray">{s} · manuel</Badge>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* 8.4 Questionnaire */}
        <Card>
          <CardHeader title="8.4 — Questionnaire de Due Diligence" />
          <CardBody className="space-y-2">
            {answers.map((a) => {
              const risky = a.answer === DD_RISKY_ANSWER[a.questionKey as keyof typeof DD_RISKY_ANSWER];
              return (
                <div key={a.id} className="border-b border-slate-50 pb-2 text-sm last:border-0">
                  <p className="text-slate-700">{label(DD_QUESTION_LABELS, a.questionKey)}</p>
                  {canEdit ? (
                    <form action={saveAnswer.bind(null, p.id)} className="mt-1 flex flex-wrap items-center gap-2">
                      <input type="hidden" name="questionKey" value={a.questionKey} />
                      <Select name="answer" defaultValue={a.answer} className="w-24">
                        <option value="NSP">Non rens.</option><option value="OUI">Oui</option><option value="NON">Non</option>
                      </Select>
                      <Input name="justification" defaultValue={a.justification ?? ""} placeholder="Justification" className="flex-1 min-w-40" />
                      <Button type="submit" size="sm" variant="outline">OK</Button>
                    </form>
                  ) : (
                    <Badge tone={risky ? "red" : "slate"}>{label(ANSWER_LABELS, a.answer)}</Badge>
                  )}
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      {/* 8.5 Investigation renforcée */}
      <Card className="mt-4">
        <CardHeader title="8.5 — Investigation renforcée" subtitle={showInvestigation ? "Déclenchée : risque élevé/critique" : "Activée uniquement si le risque est élevé"} />
        <CardBody>
          {!showInvestigation ? (
            <EmptyState title="Investigation non requise à ce niveau de risque." />
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {invs.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2 rounded border border-slate-100 px-3 py-1.5 text-sm">
                  <span className="text-slate-700">{label(INVESTIGATION_LABELS, it.itemKey)}</span>
                  {canEdit ? (
                    <form action={upsertInvestigation.bind(null, p.id)} className="flex items-center gap-1">
                      <input type="hidden" name="itemKey" value={it.itemKey} />
                      <Select name="status" defaultValue={it.status} className="w-28 text-xs">
                        <option value="A_FAIRE">À faire</option><option value="EN_COURS">En cours</option><option value="FAIT">Fait</option><option value="NON_APPLICABLE">N/A</option>
                      </Select>
                      <Select name="result" defaultValue={it.result ?? ""} className="w-24 text-xs">
                        <option value="">—</option><option value="RAS">RAS</option><option value="ANOMALIE">Anomalie</option>
                      </Select>
                      <Button type="submit" size="sm" variant="outline">OK</Button>
                    </form>
                  ) : (
                    <Badge tone={it.result === "ANOMALIE" ? "red" : it.status === "FAIT" ? "green" : "slate"}>{it.result || it.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 8.7 Surveillance */}
        <Card>
          <CardHeader title="8.7 — Surveillance continue" subtitle="Événements & incidents" />
          <CardBody className="space-y-2">
            {p.events.length === 0 ? <p className="text-sm text-slate-400">Aucun événement.</p> : p.events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2 text-sm last:border-0">
                <div>
                  <p className="text-slate-700">{label(MONITORING_LABELS, ev.type)} {ev.resolved && <Badge tone="gray">résolu</Badge>}</p>
                  <p className="text-xs text-slate-400">{formatDate(ev.detectedAt)}{ev.detail ? ` · ${ev.detail}` : ""}</p>
                </div>
                {canEdit && !ev.resolved && (
                  <form action={resolveMonitoringEvent.bind(null, ev.id, p.id)}>
                    <Button type="submit" size="sm" variant="ghost"><Check className="h-3.5 w-3.5" /> Résoudre</Button>
                  </form>
                )}
              </div>
            ))}
            {canEdit && (
              <form action={addMonitoringEvent.bind(null, p.id)} className="mt-2 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                <Select name="type" defaultValue="INCIDENT_CONTRACTUEL" className="w-52 text-xs">
                  {Object.entries(MONITORING_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Input name="detail" placeholder="Détail" className="flex-1 min-w-32" />
                <Button type="submit" size="sm" variant="outline">Signaler</Button>
              </form>
            )}
          </CardBody>
        </Card>

        {/* Décision */}
        <Card>
          <CardHeader title="Décision" subtitle="Validation / conditionnelle / DD renforcée / rejet" />
          <CardBody>
            <div className="mb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-slate-400" />
              <span className="text-sm text-slate-600">Décision actuelle :</span>
              {p.decision ? <DecisionBadge value={p.decision} /> : <Badge tone="gray">En attente</Badge>}
            </div>
            {p.decisionNote && <p className="mb-3 text-sm text-slate-600">« {p.decisionNote} »</p>}
            {canValidate ? (
              <form action={recordDecision.bind(null, p.id)} className="space-y-3">
                <Field label="Décision">
                  <Select name="decision" defaultValue={p.decision ?? "VALIDE"}>
                    <option value="VALIDE">Validé</option>
                    <option value="VALIDE_CONDITIONNEL">Validation conditionnelle</option>
                    <option value="DD_RENFORCEE">Due diligence renforcée</option>
                    <option value="REJETE">Rejeté</option>
                  </Select>
                </Field>
                <Field label="Motivation"><Textarea name="decisionNote" defaultValue={p.decisionNote ?? ""} /></Field>
                <Button type="submit">Enregistrer la décision</Button>
              </form>
            ) : (
              <p className="text-sm text-slate-400">Seul un validateur (Secrétaire Permanent / Administrateur) peut arrêter la décision.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
