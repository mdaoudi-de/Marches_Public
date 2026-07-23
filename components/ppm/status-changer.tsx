"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMarketStatus } from "@/actions/ppm";
import { MARKET_STATUS_LABELS, type MarketStatus } from "@/lib/enums";

const ORDER: MarketStatus[] = ["PREVU", "LANCE", "ATTRIBUE", "EXECUTE", "CLOTURE", "RESILIE"];

export function StatusChanger({ marketId, status }: { marketId: number; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        startTransition(async () => {
          await updateMarketStatus(marketId, v);
          router.refresh();
        });
      }}
      className="rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
      title="Changer le statut du marché"
    >
      {ORDER.map((s) => <option key={s} value={s}>{MARKET_STATUS_LABELS[s]}</option>)}
    </select>
  );
}
