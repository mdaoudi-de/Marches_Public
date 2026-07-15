import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recomputeAlerts } from "@/lib/alertes";

export const runtime = "nodejs";

/**
 * Recalcule les alertes. Appelable par le bouton « Recalculer », au chargement
 * du dashboard, ou par une tâche planifiée Windows (produit complet : cron réel).
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const summary = await recomputeAlerts();
  return NextResponse.json({ ok: true, ...summary });
}

export async function GET() {
  return POST();
}
