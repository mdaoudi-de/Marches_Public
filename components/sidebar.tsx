"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Gavel,
  FileSignature,
  ShoppingCart,
  Building2,
  FolderOpen,
  Bell,
  Settings,
} from "lucide-react";
import { canView } from "@/lib/rbac";
import type { AppModule } from "@/lib/enums";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  module: AppModule;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Tableau de bord", module: "DASHBOARD", icon: LayoutDashboard },
  { href: "/ppm", label: "Plan de passation", module: "PPM", icon: ClipboardList },
  { href: "/passation", label: "Passation", module: "PASSATION", icon: Gavel },
  { href: "/contrats", label: "Contrats & exécution", module: "CONTRATS", icon: FileSignature },
  { href: "/achats", label: "Achats sous seuil", module: "ACHATS", icon: ShoppingCart },
  { href: "/fournisseurs", label: "Fournisseurs", module: "FOURNISSEURS", icon: Building2 },
  { href: "/ged", label: "Documents (GED)", module: "GED", icon: FolderOpen },
  { href: "/alertes", label: "Alertes", module: "ALERTES", icon: Bell },
  { href: "/admin", label: "Administration", module: "ADMIN", icon: Settings },
];

export function Sidebar({ role, alertCount }: { role: string; alertCount: number }) {
  const pathname = usePathname();
  const items = NAV.filter((i) => canView(role, i.module));

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          MP
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-white">Marchés publics</p>
          <p className="text-[11px] text-slate-400">Suivi & pilotage</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <span className="flex items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </span>
              {item.module === "ALERTES" && alertCount > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 px-4 py-3 text-[11px] text-slate-500">
        POC · AFRICA LINK BUSINESS
      </div>
    </aside>
  );
}
