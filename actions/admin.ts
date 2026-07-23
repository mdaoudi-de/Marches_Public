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

export async function createDirection(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ADMIN", "admin");
  const name = String(formData.get("name") ?? "").trim();
  const code = String(formData.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!name || !code) throw new Error("Code et nom requis.");
  const exists = await prisma.direction.findUnique({ where: { code } });
  if (exists) throw new Error("Ce code de direction existe déjà.");
  const d = await prisma.direction.create({ data: { code, name } });
  await logAudit({ userId: user.id, action: "CREATE", module: "ADMIN", entityType: "Direction", entityId: d.id, detail: `Création de la direction ${name}` });
  revalidatePath("/admin/directions");
}

export async function toggleDirection(id: number, active: boolean): Promise<void> {
  const user = await requireUser();
  assertCan(user, "ADMIN", "admin");
  await prisma.direction.update({ where: { id }, data: { active } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "ADMIN", entityType: "Direction", entityId: id, detail: `Direction ${active ? "activée" : "désactivée"}` });
  revalidatePath("/admin/directions");
}
