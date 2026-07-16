import "server-only";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

/**
 * Authentification désactivée pour ce déploiement : toutes les actions sont
 * exécutées comme l'administrateur système (premier utilisateur de rôle ADMIN).
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const user = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!user) return null;
  return { id: user.id, username: user.username, role: user.role, fullName: user.fullName };
}

/** À utiliser en tête des Server Actions / pages. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Aucun utilisateur administrateur trouvé (exécuter `npm run seed`).");
  return user;
}
