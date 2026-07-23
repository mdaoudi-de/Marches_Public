import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/** Sert un document de la GED depuis Vercel Blob. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id: Number(id) } });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // filePath contient l'URL Vercel Blob (accès privé → jeton requis).
  const blobRes = await fetch(doc.filePath, {
    headers: process.env.BLOB_READ_WRITE_TOKEN ? { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` } : undefined,
  });
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
