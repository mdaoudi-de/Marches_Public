import "server-only";
import { prisma } from "@/lib/prisma";

export interface SessionUser {
  id: number;
  username: string;
  role: string;
  fullName: string;
}

/**
 * Authentification désactivée pour ce déploiement de démonstration (Vercel) :
 * toutes les actions s'exécutent comme l'administrateur système (premier
 * utilisateur de rôle ADMIN). Pour réactiver une vraie authentification,
 * restaurer la version jose/cookie (voir branche feat/module8-tiers-usd-fonarev).
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
