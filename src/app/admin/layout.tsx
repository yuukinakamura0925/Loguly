import { requireRole } from "@/lib/auth";
import AdminSidebar from "@/components/admin-sidebar";
import LogoutButton from "@/app/dashboard/logout-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireRole("platform_admin");

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <AdminSidebar />
      <div className="flex-1">
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {profile.display_name} (Platform Admin)
          </span>
          <LogoutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
