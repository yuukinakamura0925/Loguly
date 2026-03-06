import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/auth";
import OrgSidebar from "@/components/org-sidebar";
import { OrgHeader } from "@/components/org-header";

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
        <OrgHeader displayName={profile.display_name || ""} orgName={org.name} avatarUrl={profile.avatar_url} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
