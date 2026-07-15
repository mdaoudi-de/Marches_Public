"use server";

import fs from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

const STORAGE = path.join(process.cwd(), "storage", "documents");

export async function uploadDocument(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "GED", "edit");

  const file = formData.get("file") as File | null;
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "AUTRE");
  const marketId = formData.get("marketId") ? Number(formData.get("marketId")) : null;
  const replacesId = formData.get("replacesDocumentId") ? Number(formData.get("replacesDocumentId")) : null;

  if (!file || file.size === 0) throw new Error("Aucun fichier fourni.");
  if (!title) throw new Error("Le titre est requis.");

  if (!fs.existsSync(STORAGE)) fs.mkdirSync(STORAGE, { recursive: true });
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const fileName = `up-${Date.now()}-${safe}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(path.join(STORAGE, fileName), bytes);

  let version = 1;
  if (replacesId) {
    const old = await prisma.document.findUnique({ where: { id: replacesId } });
    if (old) {
      version = old.version + 1;
      await prisma.document.update({ where: { id: replacesId }, data: { isCurrentVersion: false, archived: true } });
    }
  }

  const doc = await prisma.document.create({
    data: {
      category, title, fileName, filePath: fileName,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size, version, isCurrentVersion: true,
      replacesDocumentId: replacesId, marketId, uploadedById: user.id,
    },
  });
  await logAudit({ userId: user.id, action: "UPLOAD", module: "GED", entityType: "Document", entityId: doc.id, detail: `Import « ${title} »${version > 1 ? ` (v${version})` : ""}` });
  revalidatePath("/ged");
}

export async function archiveDocument(id: number): Promise<void> {
  const user = await requireUser();
  assertCan(user, "GED", "edit");
  await prisma.document.update({ where: { id }, data: { archived: true } });
  await logAudit({ userId: user.id, action: "UPDATE", module: "GED", entityType: "Document", entityId: id, detail: "Document archivé" });
  revalidatePath("/ged");
}
