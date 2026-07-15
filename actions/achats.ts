"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function createPurchaseRequest(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ACHATS", "edit");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("estimatedAmountFC") ?? 0);
  if (!description || !amount) throw new Error("Description et montant estimé requis.");

  const count = await prisma.purchaseRequest.count();
  const reference = `DA-2026-${String(count + 1).padStart(3, "0")}`;
  await prisma.purchaseRequest.create({
    data: { reference, requesterId: user.id, description, estimatedAmountFC: amount, status: "DEMANDE" },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "ACHATS", entityType: "PurchaseRequest", detail: `Demande d'achat ${reference}` });
  revalidatePath("/achats");
  redirect("/achats");
}

const ALLOWED = new Set(["APPROUVEE", "REJETEE", "COMMANDEE", "PAYEE"]);

export async function advancePurchaseRequest(id: number, status: string): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ACHATS", "edit");
  if (!ALLOWED.has(status)) throw new Error("Transition non autorisée.");

  const isDecision = status === "APPROUVEE" || status === "REJETEE";
  await prisma.purchaseRequest.update({
    where: { id },
    data: {
      status,
      ...(isDecision ? { decisionById: user.id, decisionDate: new Date() } : {}),
    },
  });
  await logAudit({ userId: user.id, action: "UPDATE", module: "ACHATS", entityType: "PurchaseRequest", entityId: id, detail: `Statut → ${status}` });
  revalidatePath("/achats");
}
