import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getVideoStorage } from "@/lib/video-storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { videoId } = await params;
  const id = parseInt(videoId, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid video ID" }, { status: 400 });
  }

  // 動画情報を取得してcf_video_idを得る
  const { data: video } = await supabase
    .from("videos")
    .select("cf_video_id, title")
    .eq("id", id)
    .single();

  if (!video) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const storage = getVideoStorage();
  const downloadUrl = storage.getDownloadUrl(video.cf_video_id);

  // 外部ストレージからfetchしてそのまま流す
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    return NextResponse.json({ error: "Download failed" }, { status: 502 });
  }

  const filename = `${video.title}.mp4`;

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      ...(res.headers.get("content-length")
        ? { "Content-Length": res.headers.get("content-length")! }
        : {}),
    },
  });
}
