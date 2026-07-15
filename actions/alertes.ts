"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { recomputeAlerts } from "@/lib/alertes";

export async function acknowledgeAlert(id: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ALERTES", "view");
  await prisma.alert.update({ where: { id }, data: { status: "ACQUITTEE", acknowledgedById: user.id } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "ALERTES", entityType: "Alert", entityId: id, detail: "Alerte acquittée" });
  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}

export async function resolveAlert(id: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ALERTES", "view");
  await prisma.alert.update({ where: { id }, data: { status: "RESOLUE", resolvedAt: new Date() } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "ALERTES", entityType: "Alert", entityId: id, detail: "Alerte résolue" });
  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}

export async function recomputeAlertsAction(): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ALERTES", "view");
  await recomputeAlerts();
  await logAudit({ userId: user.id, action: "UPDATE", module: "ALERTES", detail: "Recalcul des alertes" });
  revalidatePath("/alertes");
  revalidatePath("/dashboard");
}
