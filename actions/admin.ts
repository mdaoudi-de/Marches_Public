"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function createUser(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ADMIN", "admin");

  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = String(formData.get("role") ?? "RESP_PREPARATION");
  const password = String(formData.get("password") ?? "");

  if (!username || !email || !fullName || !password) throw new Error("Tous les champs sont requis.");
  const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (exists) throw new Error("Identifiant ou email déjà utilisé.");

  const created = await prisma.user.create({
    data: { username, email, fullName, role, passwordHash: bcrypt.hashSync(password, 8) },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "ADMIN", entityType: "User", entityId: created.id, detail: `Création de l'utilisateur ${username} (${role})` });
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function toggleUserActive(id: number, active: boolean): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ADMIN", "admin");
  await prisma.user.update({ where: { id }, data: { active } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "ADMIN", entityType: "User", entityId: id, detail: `Utilisateur ${active ? "activé" : "désactivé"}` });
  revalidatePath("/admin/users");
}
