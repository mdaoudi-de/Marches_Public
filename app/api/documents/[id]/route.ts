import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Sert un document de la GED — accès réservé aux utilisateurs authentifiés. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id: Number(id) } });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const blobRes = await fetch(doc.filePath);
  if (!blobRes.ok) return NextResponse.json({ error: "Fichier manquant sur le serveur" }, { status: 404 });

  const data = await blobRes.arrayBuffer();
  return new NextResponse(data, {
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
