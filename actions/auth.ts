"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Identifiant et mot de passe requis." };
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.active) {
    return { error: "Identifiants invalides." };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "Identifiants invalides." };
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
  });
  await logAudit({
    userId: user.id,
    action: "LOGIN",
    module: "ADMIN",
    detail: `Connexion de ${user.fullName}`,
  });

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const user = await getCurrentUser();
  if (user) {
    await logAudit({
      userId: user.id,
      action: "LOGOUT",
      module: "ADMIN",
      detail: `Déconnexion de ${user.fullName}`,
    });
  }
  await destroySession();
  redirect("/login");
}
