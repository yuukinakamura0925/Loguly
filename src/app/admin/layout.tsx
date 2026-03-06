import { requireRole } from "@/lib/auth";
import AdminSidebar from "@/components/admin-sidebar";
import { AdminHeader } from "@/components/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("platform_admin");

  return (
    <div className="h-screen bg-slate-100 dark:bg-slate-950 flex overflow-hidden">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader displayName={profile.display_name || ""} avatarUrl={profile.avatar_url} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
