import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole, getCurrentOrg } from "@/lib/auth";
import { getPublishedVideoById, listLicenseVideoIdsForOrg } from "@/lib/db";
import { getVideoStorage } from "@/lib/video-storage";
import { ArrowLeftIcon } from "@/components/icons";
import PreviewPlayer from "./preview-player";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrgVideoPreviewPage({ params }: Props) {
  const { id } = await params;
  const videoId = parseInt(id, 10);
  if (isNaN(videoId)) notFound();

  await requireRole("org_admin");
  const org = await getCurrentOrg();
  if (!org) return null;

  const supabase = await createClient();

  // 動画の割り当てがあるか確認
  const { data: licenseIds } = await listLicenseVideoIdsForOrg(supabase, org.id);
  const hasLicense = licenseIds?.some((l) => l.video_id === videoId);
  if (!hasLicense) notFound();

  const { data: video } = await getPublishedVideoById(supabase, videoId);
  if (!video) notFound();

  const videoUrl = getVideoStorage().getPlaybackUrl(video.cf_video_id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/org/videos"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          動画一覧に戻る
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
          {video.title}
        </h1>
        {video.description && (
          <p className="text-sm text-slate-500 mt-1">{video.description}</p>
        )}
      </div>

      <PreviewPlayer
        videoUrl={videoUrl}
        title={video.title}
        duration={video.duration}
      />
    </div>
  );
}
