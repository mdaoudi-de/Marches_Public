import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { buildJournalExcel } from "@/lib/exports";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" }, take: 1000,
    include: { user: { select: { fullName: true } } },
  });
  const rows = logs.map((l) => ({ createdAt: l.createdAt, userName: l.user?.fullName ?? "Système", action: l.action, module: l.module, detail: l.detail }));

  await logAudit({ userId: user.id, action: "EXPORT", module: "ADMIN", detail: "Export du journal d'audit" });

  const buf = await buildJournalExcel(rows);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="journal-audit.xlsx"`,
    },
  });
}
