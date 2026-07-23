"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { today } from "@/lib/config";
import { runScoring } from "@/lib/tiers-scoring";
import { TP_DOC_ORDER, TP_DOC_LABELS, DD_ORDER, INVESTIGATION_ORDER } from "@/lib/enums";

function pDate(v: FormDataEntryValue | null): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00.000Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function computeDocControl(provided: boolean, expiry: Date | null): string {
  if (!provided) return "MANQUANT";
  if (expiry && expiry < today()) return "EXPIRE";
  return "OK";
}

/* ------------------------------------------------------------ CRUD ======== */

export async function createProfile(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  const denomination = String(formData.get("denomination") ?? "").trim();
  if (!denomination) throw new Error("La dénomination est requise.");
  const supplierId = formData.get("supplierId") ? Number(formData.get("supplierId")) : null;

  const profile = await prisma.thirdPartyProfile.create({
    data: {
      denomination, supplierId,
      rccm: String(formData.get("rccm") ?? "") || null,
      idNational: String(formData.get("idNational") ?? "") || null,
      nif: String(formData.get("nif") ?? "") || null,
      taxNumber: String(formData.get("taxNumber") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      province: String(formData.get("province") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      sector: String(formData.get("sector") ?? "") || null,
      stage: "COLLECTE",
      createdById: user.id,
      documents: { create: TP_DOC_ORDER.map((t) => ({ docType: t, title: TP_DOC_LABELS[t], provided: false, controlStatus: "MANQUANT" })) },
      answers: { create: DD_ORDER.map((q) => ({ questionKey: q, answer: "NSP" })) },
      investigations: { create: INVESTIGATION_ORDER.map((k) => ({ itemKey: k, status: "A_FAIRE" })) },
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "TIERS", entityType: "ThirdPartyProfile", entityId: profile.id, detail: `Enregistrement du tiers ${denomination}` });
  await runScoring(profile.id);
  redirect(`/tiers/${profile.id}`);
}

export async function updateQualification(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.thirdPartyProfile.update({
    where: { id: profileId },
    data: {
      denomination: String(formData.get("denomination") ?? "").trim(),
      rccm: String(formData.get("rccm") ?? "") || null,
      idNational: String(formData.get("idNational") ?? "") || null,
      nif: String(formData.get("nif") ?? "") || null,
      taxNumber: String(formData.get("taxNumber") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
      province: String(formData.get("province") ?? "") || null,
      city: String(formData.get("city") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      contactPerson: String(formData.get("contactPerson") ?? "") || null,
      sector: String(formData.get("sector") ?? "") || null,
      activityCode: String(formData.get("activityCode") ?? "") || null,
      creationDate: pDate(formData.get("creationDate")),
      experienceYrs: formData.get("experienceYrs") ? Number(formData.get("experienceYrs")) : null,
      refsClients: String(formData.get("refsClients") ?? "") || null,
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "TIERS", entityType: "ThirdPartyProfile", entityId: profileId, detail: "Mise à jour de la qualification" });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function addRepresentative(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.thirdPartyRepresentative.create({
    data: { profileId, role: String(formData.get("role") ?? "GERANT"), fullName: String(formData.get("fullName") ?? "").trim(), idDocument: String(formData.get("idDocument") ?? "") || null },
  });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function addShareholder(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.thirdPartyShareholder.create({
    data: {
      profileId, name: String(formData.get("name") ?? "").trim(),
      sharePct: Number(formData.get("sharePct") ?? 0),
      isBeneficialOwner: formData.get("isBeneficialOwner") === "on",
      nationality: String(formData.get("nationality") ?? "") || null,
    },
  });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function upsertDocument(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  const docType = String(formData.get("docType"));
  const provided = formData.get("provided") === "on";
  const expiryDate = pDate(formData.get("expiryDate"));
  const issueDate = pDate(formData.get("issueDate"));
  const controlStatus = computeDocControl(provided, expiryDate);
  await prisma.thirdPartyDocument.upsert({
    where: { profileId_docType: { profileId, docType } },
    create: { profileId, docType, title: TP_DOC_LABELS[docType as keyof typeof TP_DOC_LABELS] ?? docType, provided, issueDate, expiryDate, controlStatus },
    update: { provided, issueDate, expiryDate, controlStatus },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "TIERS", entityType: "ThirdPartyDocument", entityId: profileId, detail: `Pièce ${docType} → ${controlStatus}` });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function saveAnswer(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  const questionKey = String(formData.get("questionKey"));
  await prisma.dueDiligenceAnswer.upsert({
    where: { profileId_questionKey: { profileId, questionKey } },
    create: { profileId, questionKey, answer: String(formData.get("answer") ?? "NSP"), justification: String(formData.get("justification") ?? "") || null },
    update: { answer: String(formData.get("answer") ?? "NSP"), justification: String(formData.get("justification") ?? "") || null },
  });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function upsertInvestigation(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  const itemKey = String(formData.get("itemKey"));
  await prisma.enhancedInvestigationItem.upsert({
    where: { profileId_itemKey: { profileId, itemKey } },
    create: { profileId, itemKey, status: String(formData.get("status") ?? "A_FAIRE"), result: String(formData.get("result") ?? "") || null },
    update: { status: String(formData.get("status") ?? "A_FAIRE"), result: String(formData.get("result") ?? "") || null },
  });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function toggleControl(profileId: number, controlKey: string, triggered: boolean): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.internalControlFlag.upsert({
    where: { profileId_controlKey: { profileId, controlKey } },
    create: { profileId, controlKey, triggered, computed: false, severity: triggered ? "WARNING" : "INFO" },
    update: { triggered, severity: triggered ? "WARNING" : "INFO" },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "TIERS", entityType: "InternalControlFlag", entityId: profileId, detail: `Contrôle ${controlKey} → ${triggered ? "déclenché" : "levé"}` });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function addMonitoringEvent(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.thirdPartyMonitoringEvent.create({
    data: { profileId, type: String(formData.get("type")), detail: String(formData.get("detail") ?? "") || null, detectedAt: today() },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "TIERS", entityType: "ThirdPartyMonitoringEvent", entityId: profileId, detail: "Événement de surveillance enregistré" });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function resolveMonitoringEvent(id: number, profileId: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await prisma.thirdPartyMonitoringEvent.update({ where: { id }, data: { resolved: true } });
  await runScoring(profileId);
  revalidatePath(`/tiers/${profileId}`);
}

export async function rescoreProfile(profileId: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "edit");
  await runScoring(profileId);
  await logAudit({ userId: user.id, action: "UPDATE", module: "TIERS", entityType: "ThirdPartyProfile", entityId: profileId, detail: "Recalcul du score de risque" });
  revalidatePath(`/tiers/${profileId}`);
}

export async function recordDecision(profileId: number, formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "TIERS", "validate");
  const decision = String(formData.get("decision"));
  await prisma.thirdPartyProfile.update({
    where: { id: profileId },
    data: { decision, decisionNote: String(formData.get("decisionNote") ?? "") || null, stage: "SURVEILLANCE" },
  });
  await logAudit({ userId: user.id, action: "VALIDATE", module: "TIERS", entityType: "ThirdPartyProfile", entityId: profileId, detail: `Décision : ${decision}` });
  revalidatePath(`/tiers/${profileId}`);
}
