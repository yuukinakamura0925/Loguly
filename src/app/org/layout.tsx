import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/auth";
import OrgSidebar from "@/components/org-sidebar";
import LogoutButton from "@/app/dashboard/logout-button";

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
    <div className="min-h-screen bg-gray-900 flex">
      <OrgSidebar orgName={org.name} />
      <div className="flex-1">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {profile.display_name} (組織管理者)
          </span>
          <LogoutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
