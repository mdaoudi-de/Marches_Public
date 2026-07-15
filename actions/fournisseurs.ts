"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";

export async function createSupplier(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "FOURNISSEURS", "edit");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Le nom du fournisseur est requis.");
  const supplier = await prisma.supplier.create({
    data: {
      name,
      type: String(formData.get("type") ?? "ENTREPRISE"),
      city: String(formData.get("city") ?? "") || null,
      phone: String(formData.get("phone") ?? "") || null,
      email: String(formData.get("email") ?? "") || null,
      contactPerson: String(formData.get("contactPerson") ?? "") || null,
      rccm: String(formData.get("rccm") ?? "") || null,
      nif: String(formData.get("nif") ?? "") || null,
      address: String(formData.get("address") ?? "") || null,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "FOURNISSEURS", entityType: "Supplier", entityId: supplier.id, detail: `Création du fournisseur ${name}` });
  revalidatePath("/fournisseurs");
  redirect(`/fournisseurs/${supplier.id}`);
}

export async function addEvaluation(formData: FormData): Promise<void> {
  const user = await requireUser();
  assertCan(user, "FOURNISSEURS", "edit");
  const supplierId = Number(formData.get("supplierId"));
  const q = Number(formData.get("qualityScore"));
  const del = Number(formData.get("deadlineScore"));
  const conf = Number(formData.get("conformityScore"));
  const sat = Number(formData.get("satisfactionScore"));
  const marketId = formData.get("marketId") ? Number(formData.get("marketId")) : null;
  const comment = String(formData.get("comment") ?? "") || null;
  const globalScore = Number(((q + del + conf + sat) / 4).toFixed(2));

  await prisma.supplierEvaluation.create({
    data: {
      supplierId, marketId, evaluatorId: user.id,
      qualityScore: q, deadlineScore: del, conformityScore: conf, satisfactionScore: sat,
      globalScore, comment,
    },
  });
  await logAudit({ userId: user.id, action: "CREATE", module: "FOURNISSEURS", entityType: "SupplierEvaluation", entityId: supplierId, detail: `Évaluation ajoutée (note ${globalScore}/5)` });
  revalidatePath(`/fournisseurs/${supplierId}`);
}
