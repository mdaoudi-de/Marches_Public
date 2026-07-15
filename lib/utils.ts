import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CURRENCY_LABEL } from "@/lib/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formate un montant entier (FC, sans décimales) : 1234567 -> "1 234 567 FC". */
export function formatFC(amount: number | bigint | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const n = typeof amount === "bigint" ? Number(amount) : amount;
  return `${n.toLocaleString("fr-FR")} ${CURRENCY_LABEL}`;
}

/** Formate un nombre compact : 1234567 -> "1,2 M". */
export function formatCompactFC(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000)
    return `${(amount / 1_000_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Md ${CURRENCY_LABEL}`;
  if (abs >= 1_000_000)
    return `${(amount / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M ${CURRENCY_LABEL}`;
  if (abs >= 1_000)
    return `${(amount / 1_000).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} k ${CURRENCY_LABEL}`;
  return `${amount.toLocaleString("fr-FR")} ${CURRENCY_LABEL}`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
}

/** Convertit une date en valeur d'input HTML `type=date` (YYYY-MM-DD, en UTC). */
export function toDateInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "il y a N jours" / "dans N jours". */
export function humanDelay(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  if (days === 0) return "aujourd'hui";
  if (days > 0) return `+${days} j`;
  return `${days} j`;
}
