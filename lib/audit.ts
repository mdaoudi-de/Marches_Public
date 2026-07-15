import { prisma } from "@/lib/prisma";
import type { AppModule, AuditAction } from "@/lib/enums";

export interface AuditParams {
  userId?: number | null;
  action: AuditAction;
  module: AppModule;
  entityType?: string;
  entityId?: number;
  detail?: string;
}

/** Journalise une action (traçabilité / audit — spec § « journalisation »). */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        module: params.module,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        detail: params.detail ?? null,
      },
    });
  } catch (e) {
    // La journalisation ne doit jamais bloquer l'action métier.
    console.error("logAudit failed:", e);
  }
}
