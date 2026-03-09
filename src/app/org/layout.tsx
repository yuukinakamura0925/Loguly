import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getCurrentOrg } from "@/lib/auth";
import OrgSidebar from "@/components/org-sidebar";
import { OrgHeader } from "@/components/org-header";
import { OnboardingWrapper } from "@/components/onboarding-wrapper";
import { completeOnboarding } from "@/app/onboarding-actions";

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

  const showTour = !profile.onboarding_completed_at;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 flex">
      <OrgSidebar orgName={org.name} />
      <div className="flex-1 flex flex-col">
        <OrgHeader displayName={profile.display_name || ""} orgName={org.name} avatarUrl={profile.avatar_url} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
      {showTour && <OnboardingWrapper role="org_admin" showTour completeAction={completeOnboarding} />}
    </div>
  );
}
