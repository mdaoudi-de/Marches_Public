import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const alertCount = await prisma.alert.count({ where: { status: "ACTIVE" } });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} alertCount={alertCount} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar fullName={user.fullName} role={user.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
