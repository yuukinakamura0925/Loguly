import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/db";
import { getVideoStorage } from "@/lib/video-storage";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await getProfileById(supabase, user.id);
  if (!profile || profile.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { videoId } = await params;
  const storage = getVideoStorage();

  try {
    await storage.deleteVideo(videoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete video from storage:", error);
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 }
    );
  }
}
