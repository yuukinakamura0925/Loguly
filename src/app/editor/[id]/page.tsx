"use client";

import { useState, useEffect, useCallback, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { getVideoById } from "@/lib/db";
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

function formatTimeDisplay(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

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
  const [actualDuration, setActualDuration] = useState<number | null>(null);

  // Clips
  const [subtitles, setSubtitles] = useState<SubtitleClip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);

  // Selection
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);

  // 作成モード
  const [isCreatingSubtitle, setIsCreatingSubtitle] = useState(false);
  const [isCreatingAudio, setIsCreatingAudio] = useState(false);

  // 左パネル開閉
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  // セクション折りたたみ
  const [isSubtitlesOpen, setIsSubtitlesOpen] = useState(true);
  const [isAudioOpen, setIsAudioOpen] = useState(true);

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

  const videoDuration = actualDuration ?? (video?.duration ?? 0) * 1000;

  const handleAddSubtitle = useCallback(() => {
    // 現在位置に既に字幕があれば何もしない
    const hasOverlap = subtitles.some(
      (s) => currentTime >= s.startTime && currentTime < s.endTime
    );
    if (hasOverlap) return;

    const newSubtitle: SubtitleClip = {
      id: crypto.randomUUID(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 3000, videoDuration),
      text: "新しい字幕",
    };
    setSubtitles((prev) => [...prev, newSubtitle]);
    setSelectedSubtitle(newSubtitle.id);
    setSelectedAudio(null);
  }, [currentTime, videoDuration, subtitles]);

  const handleStartCreateAudio = useCallback(() => {
    setIsCreatingAudio(true);
    setSelectedSubtitle(null);
    setSelectedAudio(null);
  }, []);

  const handleInsertAudio = useCallback((text: string, duration: number, startTime: number) => {
    const newEndTime = startTime + duration;
    const newAudio: AudioClip = {
      id: crypto.randomUUID(),
      startTime,
      duration,
      text,
      status: "ready",
      audioUrl: `audio-${Date.now()}.mp3`,
    };
    setAudioClips((prev) => {
      // 他の音声と重なるかチェック
      const hasOverlap = prev.some(
        (a) => startTime < a.startTime + a.duration && newEndTime > a.startTime
      );
      if (hasOverlap) return prev;
      return [...prev, newAudio];
    });
    setSelectedAudio(newAudio.id);
    setIsCreatingAudio(false);
  }, []);

  const handleCancelCreateAudio = useCallback(() => {
    setIsCreatingAudio(false);
  }, []);

  const handleUpdateSubtitle = useCallback(
    (id: string, updates: Partial<SubtitleClip>) => {
      setSubtitles((prev) => {
        const current = prev.find((s) => s.id === id);
        if (!current) return prev;

        const newStart = updates.startTime ?? current.startTime;
        const newEnd = updates.endTime ?? current.endTime;

        // 時間が変更される場合のみ重複チェック
        if (updates.startTime !== undefined || updates.endTime !== undefined) {
          const hasOverlap = prev.some(
            (s) => s.id !== id && newStart < s.endTime && newEnd > s.startTime
          );
          if (hasOverlap) return prev;
        }

        return prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      });
    },
    []
  );

  const handleUpdateAudio = useCallback(
    (id: string, updates: Partial<AudioClip>) => {
      setAudioClips((prev) => {
        const current = prev.find((a) => a.id === id);
        if (!current) return prev;

        const newStart = updates.startTime ?? current.startTime;
        const newDuration = updates.duration ?? current.duration;
        const newEnd = newStart + newDuration;

        // 時間が変更される場合のみ重複チェック
        if (updates.startTime !== undefined || updates.duration !== undefined) {
          const hasOverlap = prev.some(
            (a) => a.id !== id && newStart < a.startTime + a.duration && newEnd > a.startTime
          );
          if (hasOverlap) return prev;
        }

        return prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      });
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

  const handleMoveSubtitle = useCallback((id: string, newStartTime: number) => {
    setSubtitles((prev) => {
      const moving = prev.find((s) => s.id === id);
      if (!moving) return prev;

      const clipDuration = moving.endTime - moving.startTime;
      const newEndTime = newStartTime + clipDuration;

      // 他の字幕と重なるかチェック
      const hasOverlap = prev.some(
        (s) => s.id !== id && newStartTime < s.endTime && newEndTime > s.startTime
      );
      if (hasOverlap) return prev;

      return prev.map((s) =>
        s.id === id ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
      );
    });
  }, []);

  const handleMoveAudio = useCallback((id: string, newStartTime: number) => {
    setAudioClips((prev) => {
      const moving = prev.find((a) => a.id === id);
      if (!moving) return prev;

      const newEndTime = newStartTime + moving.duration;

      // 他の音声と重なるかチェック
      const hasOverlap = prev.some(
        (a) => a.id !== id && newStartTime < a.startTime + a.duration && newEndTime > a.startTime
      );
      if (hasOverlap) return prev;

      return prev.map((a) => (a.id === id ? { ...a, startTime: newStartTime } : a));
    });
  }, []);

  const handleResizeSubtitle = useCallback(
    (id: string, newStartTime: number, newEndTime: number) => {
      setSubtitles((prev) => {
        // 他の字幕と重なるかチェック
        const hasOverlap = prev.some(
          (s) => s.id !== id && newStartTime < s.endTime && newEndTime > s.startTime
        );
        if (hasOverlap) return prev;

        return prev.map((s) =>
          s.id === id ? { ...s, startTime: newStartTime, endTime: newEndTime } : s
        );
      });
    },
    []
  );

  const handleClose = () => {
    window.close();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-slate-400">読み込み中...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-slate-400">動画が見つかりません</div>
      </div>
    );
  }

  const selectedSubtitleData = subtitles.find((s) => s.id === selectedSubtitle);
  const selectedAudioData = audioClips.find((a) => a.id === selectedAudio);

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-medium">Loguly Editor</span>
          </div>
          <span className="text-slate-600">|</span>
          <h1 className="text-slate-300">{video.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            閉じる
          </button>
          <button className="px-4 py-1.5 bg-slate-700 text-slate-300 text-sm rounded hover:bg-slate-600 transition-colors">
            下書き保存
          </button>
          <button className="px-4 py-1.5 bg-cyan-600 text-white text-sm rounded hover:bg-cyan-500 transition-colors">
            公開
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Clips + Property (collapsible) */}
        {isPanelOpen && (
          <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col text-[13px]">
            {/* Clips List (Top - 50%) */}
            <div className="h-1/2 overflow-auto border-b border-slate-800">
              <div className="py-1">
                {/* Subtitles Section */}
                <div className="mb-1">
                  <button
                    onClick={() => setIsSubtitlesOpen(!isSubtitlesOpen)}
                    className="w-full flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-400 hover:bg-slate-800/50"
                  >
                    <svg className={`w-3 h-3 transition-transform ${isSubtitlesOpen ? "" : "-rotate-90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-[11px] font-medium uppercase tracking-wider">字幕</span>
                    <span className="text-[10px] text-slate-600 ml-auto">{subtitles.length}</span>
                  </button>
                  {isSubtitlesOpen && [...subtitles].sort((a, b) => a.startTime - b.startTime).map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => {
                        setSelectedSubtitle(sub.id);
                        setSelectedAudio(null);
                        handleSeek(sub.startTime);
                      }}
                      className={`w-full flex items-center gap-2 pl-5 pr-2 py-1 text-left transition-colors ${
                        selectedSubtitle === sub.id
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${selectedSubtitle === sub.id ? "text-white" : "text-amber-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      <span className="truncate flex-1">{sub.text}</span>
                      <span className={`text-[10px] flex-shrink-0 ${selectedSubtitle === sub.id ? "text-blue-200" : "text-slate-500"}`}>
                        {formatTimeDisplay(sub.startTime)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Audio Section */}
                <div>
                  <button
                    onClick={() => setIsAudioOpen(!isAudioOpen)}
                    className="w-full flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-slate-400 hover:bg-slate-800/50"
                  >
                    <svg className={`w-3 h-3 transition-transform ${isAudioOpen ? "" : "-rotate-90"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span className="text-[11px] font-medium uppercase tracking-wider">読み上げ</span>
                    <span className="text-[10px] text-slate-600 ml-auto">{audioClips.length}</span>
                  </button>
                  {isAudioOpen && [...audioClips].sort((a, b) => a.startTime - b.startTime).map((audio) => (
                    <button
                      key={audio.id}
                      onClick={() => {
                        setSelectedAudio(audio.id);
                        setSelectedSubtitle(null);
                        handleSeek(audio.startTime);
                      }}
                      className={`w-full flex items-center gap-2 pl-5 pr-2 py-1 text-left transition-colors ${
                        selectedAudio === audio.id
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${selectedAudio === audio.id ? "text-white" : "text-teal-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      </svg>
                      <span className="truncate flex-1">{audio.text || "音声"}</span>
                      <span className={`text-[10px] flex-shrink-0 ${selectedAudio === audio.id ? "text-blue-200" : "text-slate-500"}`}>
                        {formatTimeDisplay(audio.startTime)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Empty state */}
                {subtitles.length === 0 && audioClips.length === 0 && (
                  <div className="px-3 py-6 text-center text-slate-600 text-xs">
                    クリップなし
                  </div>
                )}
              </div>
            </div>

            {/* Property Panel (Bottom - 50%) */}
            <div className="h-1/2 bg-slate-800 overflow-auto">
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
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="w-5 bg-slate-800 border-r border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors flex-shrink-0"
          title={isPanelOpen ? "パネルを閉じる" : "パネルを開く"}
        >
          <svg
            className={`w-3 h-3 text-slate-400 transition-transform ${isPanelOpen ? "" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Center - Video + Timeline */}
        <div className="flex-1 flex flex-col min-w-0 p-3 gap-3">
          {/* Video Preview */}
          <div className="bg-black rounded-lg overflow-hidden shadow-lg" style={{ height: '45%' }}>
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

          {/* Timeline */}
          <div className="flex-1 bg-slate-800 rounded-lg overflow-hidden shadow-lg min-h-0">
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
        </div>
      </div>
    </div>
  );
}
