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
    <div className="min-h-screen bg-slate-950 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {profile.display_name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{profile.display_name}</div>
              <div className="text-xs text-slate-500">Platform Admin</div>
            </div>
          </div>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
