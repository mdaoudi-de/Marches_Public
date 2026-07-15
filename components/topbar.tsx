import { CalendarDays, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui";
import { ROLE_LABELS, label } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { today } from "@/lib/config";

export function Topbar({ fullName, role }: { fullName: string; role: string }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-2.5">
      <div
        className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs text-amber-700 ring-1 ring-amber-200"
        title="La date « aujourd'hui » est figée pour rendre la démonstration déterministe."
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Date de référence : <strong>{formatDate(today())}</strong>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-slate-800">{fullName}</p>
          <p className="text-[11px] text-slate-500">{label(ROLE_LABELS, role)}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
          {fullName.split(" ").map((s) => s[0]).slice(0, 2).join("")}
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </form>
      </div>
    </header>
  );
}
