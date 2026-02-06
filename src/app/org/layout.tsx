import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/auth";
import OrgSidebar from "@/components/org-sidebar";
import LogoutButton from "@/app/dashboard/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("org_admin");
  const org = await getCurrentOrg();

  if (!org) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex">
      <OrgSidebar orgName={org.name} />
      <div className="flex-1 flex flex-col">
        <header className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {profile.display_name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900 dark:text-white">{profile.display_name}</div>
              <div className="text-xs text-slate-500">組織管理者</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
