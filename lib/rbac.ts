/**
 * Contrôle d'accès basé sur les rôles (RBAC).
 *
 * 4 niveaux d'accès (spec § « droits différenciés ») ordonnés :
 *   consultation (view) < utilisateur (edit) < validateur (validate) < administrateur (admin)
 * mappés par (rôle × module).
 */
import type { AppModule, Role } from "@/lib/enums";

export type AccessLevel = "none" | "view" | "edit" | "validate" | "admin";
export type Action = "view" | "edit" | "validate" | "admin";

const RANK: Record<AccessLevel, number> = { none: 0, view: 1, edit: 2, validate: 3, admin: 4 };
const ACTION_RANK: Record<Action, number> = { view: 1, edit: 2, validate: 3, admin: 4 };

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  none: "Aucun accès",
  view: "Consultation",
  edit: "Utilisateur",
  validate: "Validateur",
  admin: "Administrateur",
};

/** Matrice rôle × module → niveau d'accès. */
export const RBAC_MATRIX: Record<Role, Record<AppModule, AccessLevel>> = {
  ADMIN: {
    DASHBOARD: "admin", PPM: "admin", PASSATION: "admin", CONTRATS: "admin",
    ACHATS: "admin", FOURNISSEURS: "admin", GED: "admin", ALERTES: "admin", ADMIN: "admin",
  },
  SECRETAIRE_PERMANENT: {
    DASHBOARD: "view", PPM: "validate", PASSATION: "validate", CONTRATS: "validate",
    ACHATS: "validate", FOURNISSEURS: "view", GED: "edit", ALERTES: "view", ADMIN: "view",
  },
  RESP_PREPARATION: {
    DASHBOARD: "view", PPM: "edit", PASSATION: "view", CONTRATS: "view",
    ACHATS: "edit", FOURNISSEURS: "edit", GED: "edit", ALERTES: "view", ADMIN: "none",
  },
  RESP_PASSATION: {
    DASHBOARD: "view", PPM: "edit", PASSATION: "edit", CONTRATS: "view",
    ACHATS: "view", FOURNISSEURS: "edit", GED: "edit", ALERTES: "view", ADMIN: "none",
  },
  RESP_SUIVI: {
    DASHBOARD: "view", PPM: "view", PASSATION: "view", CONTRATS: "edit",
    ACHATS: "edit", FOURNISSEURS: "validate", GED: "edit", ALERTES: "view", ADMIN: "none",
  },
};

type RoleLike = { role: string } | string | null | undefined;

function roleOf(user: RoleLike): Role | null {
  if (!user) return null;
  const r = typeof user === "string" ? user : user.role;
  return (r in RBAC_MATRIX ? (r as Role) : null);
}

export function accessLevel(user: RoleLike, module: AppModule): AccessLevel {
  const role = roleOf(user);
  if (!role) return "none";
  return RBAC_MATRIX[role][module];
}

/** Vrai si l'utilisateur dispose au moins du niveau requis par l'action sur le module. */
export function can(user: RoleLike, module: AppModule, action: Action = "view"): boolean {
  return RANK[accessLevel(user, module)] >= ACTION_RANK[action];
}

export function canView(user: RoleLike, module: AppModule): boolean {
  return can(user, module, "view");
}

/** Lève une erreur si l'accès est refusé — à utiliser en tête des Server Actions. */
export function assertCan(user: RoleLike, module: AppModule, action: Action = "view"): void {
  if (!can(user, module, action)) {
    throw new Error(`Accès refusé : action « ${action} » non autorisée sur le module ${module}.`);
  }
}
