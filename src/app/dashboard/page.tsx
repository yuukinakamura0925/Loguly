import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/auth";
import { getProfileById, listCategories, listPublishedVideos, getViewLogsByUser } from "@/lib/db";
import { Logo } from "@/components/logo";
import LogoutButton from "./logout-button";
import { ProgressOverview } from "./components/progress-overview";
import { CategorySection } from "./components/category-section";

type Category = {
  id: number;
  name: string;
  display_order: number;
};

type Video = {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  duration: number;
  display_order: number;
};

type ViewLog = {
  video_id: number;
  max_watched_seconds: number;
  completed: boolean;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await getProfileById(supabase, user.id);
  const org = await getCurrentOrg();
  const { data: categories } = await listCategories(supabase);
  const { data: videos } = await listPublishedVideos(supabase);
  const { data: viewLogs } = await getViewLogsByUser(supabase, user.id);

  const getCategoryProgress = (categoryId: number) => {
    const categoryVideos = videos?.filter((v) => v.category_id === categoryId) || [];
    if (categoryVideos.length === 0) return 0;
    const completed = categoryVideos.filter((v) =>
      viewLogs?.find((log) => log.video_id === v.id && log.completed)
    ).length;
    return Math.round((completed / categoryVideos.length) * 100);
  };

  const totalVideos = videos?.length || 0;
  const completedVideos = viewLogs?.filter((log) => log.completed).length || 0;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo size="sm" showText={false} />
            <div>
              <h1 className="text-lg font-bold text-white">{org ? org.name : "Loguly"}</h1>
              <p className="text-xs text-slate-500">{profile?.display_name || user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <ProgressOverview
            completedVideos={completedVideos}
            totalVideos={totalVideos}
          />
        </div>

        {/* Categories */}
        <div className="space-y-6">
          {categories?.map((category: Category) => {
            const categoryVideos = videos?.filter(
              (v: Video) => v.category_id === category.id
            ) || [];

            if (categoryVideos.length === 0) return null;

            return (
              <CategorySection
                key={category.id}
                name={category.name}
                videos={categoryVideos}
                viewLogs={viewLogs || []}
                progress={getCategoryProgress(category.id)}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}
