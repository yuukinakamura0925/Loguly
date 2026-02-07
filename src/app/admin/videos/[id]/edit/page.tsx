"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getVideoById } from "@/lib/db";
import { ArrowLeftIcon } from "@/components/icons";
import { VideoPreview } from "./components/video-preview";
import { Timeline } from "./components/timeline";
import { PropertyPanel } from "./components/property-panel";

export type SubtitleClip = {
  id: string;
  startTime: number; // ms
  endTime: number; // ms
  text: string;
};

export type AudioClip = {
  id: string;
  startTime: number; // ms
  duration: number; // ms
  text: string;
  audioUrl?: string;
  status: "pending" | "generating" | "ready" | "error";
};

type Video = {
  id: number;
  title: string;
  cf_video_id: string;
  duration: number;
};

export default function VideoEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const supabase = createClient();

  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0); // ms
  const [isPlaying, setIsPlaying] = useState(false);
  const [actualDuration, setActualDuration] = useState<number | null>(null); // 動画の実際のduration (ms)

  // Clips
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);

  // Selection
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  // 読み上げ作成モード（タイムラインに追加前のドラフト）
  const [isCreatingAudio, setIsCreatingAudio] = useState(false);

  useEffect(() => {
    async function load() {
      const id = parseInt(resolvedParams.id, 10);
      const { data } = await getVideoById(supabase, id);
      if (data) {
        setVideo(data as Video);
      }
      setLoading(false);
    }
    load();
  }, [supabase, resolvedParams.id]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setActualDuration(duration);
  }, []);

  // 実際の動画durationを優先、なければDBの値を使用
  const videoDuration = actualDuration ?? (video?.duration ?? 0) * 1000;

  const handleAddSubtitle = useCallback(() => {
    const newSubtitle: SubtitleClip = {
      id: crypto.randomUUID(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 3000, videoDuration),
      text: "新しい字幕",
    };
    setSubtitles((prev) => [...prev, newSubtitle]);
    setSelectedSubtitle(newSubtitle.id);
    setSelectedAudio(null);
  }, [currentTime, videoDuration]);

  // 「+ 読み上げ」ボタン：作成モードを開始（まだタイムラインには追加しない）
  const handleStartCreateAudio = useCallback(() => {
    setIsCreatingAudio(true);
    setSelectedSubtitle(null);
    setSelectedAudio(null);
  }, []);

  // 音声生成後にタイムラインに追加
  const handleInsertAudio = useCallback((text: string, duration: number, startTime: number) => {
    const newAudio: AudioClip = {
      id: crypto.randomUUID(),
      startTime,
      duration,
      text,
      status: "ready",
      audioUrl: `audio-${Date.now()}.mp3`,
    };
    setAudioClips((prev) => [...prev, newAudio]);
    setSelectedAudio(newAudio.id);
    setIsCreatingAudio(false);
  }, []);

  // 作成モードをキャンセル
  const handleCancelCreateAudio = useCallback(() => {
    setIsCreatingAudio(false);
  }, []);

  const handleUpdateSubtitle = useCallback(
    (id: string, updates: Partial<SubtitleClip>) => {
      setSubtitles((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const handleUpdateAudio = useCallback(
    (id: string, updates: Partial<AudioClip>) => {
      setAudioClips((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
    },
    []
  );

  const handleDeleteSubtitle = useCallback(
    (id: string) => {
      setSubtitles((prev) => prev.filter((s) => s.id !== id));
      if (selectedSubtitle === id) setSelectedSubtitle(null);
    },
    [selectedSubtitle]
  );

  const handleDeleteAudio = useCallback(
    (id: string) => {
      setAudioClips((prev) => prev.filter((a) => a.id !== id));
      if (selectedAudio === id) setSelectedAudio(null);
    },
    [selectedAudio]
  );

  // Drag & drop handlers
  const handleMoveSubtitle = useCallback((id: string, newStartTime: number) => {
    setSubtitles((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const clipDuration = s.endTime - s.startTime;
        return {
          ...s,
          startTime: newStartTime,
          endTime: newStartTime + clipDuration,
        };
      })
    );
  }, []);

  const handleMoveAudio = useCallback((id: string, newStartTime: number) => {
    setAudioClips((prev) =>
      prev.map((a) => (a.id === id ? { ...a, startTime: newStartTime } : a))
    );
  }, []);

  const handleResizeSubtitle = useCallback(
    (id: string, newStartTime: number, newEndTime: number) => {
      setSubtitles((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
        )
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <div className="text-slate-500">動画が見つかりません</div>
      </div>
    );
  }

  const selectedSubtitleData = subtitles.find(
    (s) => s.id === selectedSubtitle
  );
  const selectedAudioData = audioClips.find((a) => a.id === selectedAudio);

  return (
    <div className="h-screen flex flex-col bg-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/videos"
            className="text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeftIcon />
          </Link>
          <span className="text-slate-400">|</span>
          <h1 className="text-slate-900 font-medium">{video.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">
            キャンセル
          </button>
          <button className="px-4 py-1.5 bg-cyan-500 text-white text-sm rounded hover:bg-cyan-600 transition-colors">
            下書き保存
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
        {/* Top: Video Preview */}
        <div className="bg-slate-900 rounded-lg overflow-hidden shadow-sm" style={{ height: '35%' }}>
          <VideoPreview
            videoId={video.cf_video_id}
            currentTime={currentTime}
            duration={videoDuration}
            isPlaying={isPlaying}
            onTimeUpdate={handleTimeUpdate}
            onPlayPause={setIsPlaying}
            onSeek={handleSeek}
            onDurationChange={handleDurationChange}
            subtitles={subtitles}
          />
        </div>

        {/* Middle: Timeline */}
        <div className="flex-1 bg-white rounded-lg overflow-hidden shadow-sm min-h-0">
          <Timeline
            duration={videoDuration}
            currentTime={currentTime}
            subtitles={subtitles}
            audioClips={audioClips}
            selectedSubtitle={selectedSubtitle}
            selectedAudio={selectedAudio}
            onSeek={handleSeek}
            onSelectSubtitle={(id) => {
              setSelectedSubtitle(id);
              if (id) setSelectedAudio(null);
            }}
            onSelectAudio={(id) => {
              setSelectedAudio(id);
              if (id) setSelectedSubtitle(null);
            }}
            onAddSubtitle={handleAddSubtitle}
            onAddAudio={handleStartCreateAudio}
            onMoveSubtitle={handleMoveSubtitle}
            onMoveAudio={handleMoveAudio}
            onResizeSubtitle={handleResizeSubtitle}
          />
        </div>

        {/* Bottom: Property Panel */}
        <div className="h-44 flex-shrink-0 bg-white rounded-lg overflow-hidden shadow-sm">
          <PropertyPanel
            selectedSubtitle={selectedSubtitleData}
            selectedAudio={selectedAudioData}
            onUpdateSubtitle={handleUpdateSubtitle}
            onUpdateAudio={handleUpdateAudio}
            onDeleteSubtitle={handleDeleteSubtitle}
            onDeleteAudio={handleDeleteAudio}
            isCreatingAudio={isCreatingAudio}
            onInsertAudio={handleInsertAudio}
            onCancelCreateAudio={handleCancelCreateAudio}
            currentTime={currentTime}
          />
        </div>
      </div>
    </div>
  );
}
