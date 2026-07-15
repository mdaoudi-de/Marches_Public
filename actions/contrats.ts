"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { recomputeAlerts } from "@/lib/alertes";

export async function markPaymentPaid(paymentId: number, contractId: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "CONTRATS", "edit");
  await prisma.payment.update({ where: { id: paymentId }, data: { status: "PAYE", paidDate: new Date() } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "CONTRATS", entityType: "Payment", entityId: paymentId, detail: "Paiement marqué payé" });
  await recomputeAlerts();
  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}

export async function markReceptionDone(receptionId: number, contractId: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "CONTRATS", "edit");
  await prisma.reception.update({ where: { id: receptionId }, data: { status: "RECEPTIONNE", actualDate: new Date() } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "CONTRATS", entityType: "Reception", entityId: receptionId, detail: "Réception constatée" });
  await recomputeAlerts();
  revalidatePath(`/contrats/${contractId}`);
  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}
