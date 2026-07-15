import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { buildPpmExcel, buildPpmPdf, type ExportMarket } from "@/lib/exports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const url = new URL(req.url);
  const marketId = url.searchParams.get("market");
  const format = url.searchParams.get("format") ?? "excel";

  const markets = await prisma.market.findMany({
    where: marketId ? { id: Number(marketId) } : {},
    orderBy: { reference: "asc" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  const data: ExportMarket[] = markets.map((m) => ({
    reference: m.reference, intitule: m.intitule, nature: m.nature, procedureType: m.procedureType,
    budgetAmountFC: m.budgetAmountFC, contractAmountFC: m.contractAmountFC, status: m.status,
    budgetCode: m.budgetCode, steps: m.steps,
  }));

  await logAudit({ userId: user.id, action: "EXPORT", module: "PPM", detail: `Export ${format} du PPM${marketId ? ` (${markets[0]?.reference})` : ""}` });

  const suffix = marketId ? `-${markets[0]?.reference ?? "marche"}` : "";
  if (format === "pdf") {
    const buf = await buildPpmPdf(data, !!marketId);
    return new NextResponse(new Uint8Array(buf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="PPM${suffix}.pdf"` },
    });
  }
  const buf = await buildPpmExcel(data);
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="PPM${suffix}.xlsx"`,
    },
  });
}
