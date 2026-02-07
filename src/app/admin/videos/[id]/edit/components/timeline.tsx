"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  useDraggable,
  useSensor,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type ResizePreview = {
  id: string;
  edge: "start" | "end";
  deltaMs: number;
} | null;
import type { SubtitleClip, AudioClip } from "../page";

type TimelineProps = {
  duration: number; // ms
  currentTime: number; // ms
  subtitles: SubtitleClip[];
  audioClips: AudioClip[];
  selectedSubtitle: string | null;
  selectedAudio: string | null;
  onSeek: (time: number) => void;
  onSelectSubtitle: (id: string | null) => void;
  onSelectAudio: (id: string | null) => void;
  onAddSubtitle: () => void;
  onAddAudio: () => void;
  onMoveSubtitle: (id: string, newStartTime: number) => void;
  onMoveAudio: (id: string, newStartTime: number) => void;
  onResizeSubtitle?: (id: string, newStartTime: number, newEndTime: number) => void;
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// Resize Handle (invisible until parent hover)
function ResizeHandle({
  id,
  edge,
  clip,
}: {
  id: string;
  edge: "start" | "end";
  clip: SubtitleClip;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { type: "resize-subtitle", edge, clip },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`absolute top-0 bottom-0 w-3 cursor-ew-resize z-20 ${
        edge === "start" ? "-left-1" : "-right-1"
      } ${isDragging ? "bg-amber-600/30" : ""}`}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

// Draggable Subtitle Clip
function DraggableSubtitleClip({
  clip,
  isSelected,
  leftPercent,
  widthPercent,
  onSelect,
  resizePreview,
  duration,
}: {
  clip: SubtitleClip;
  isSelected: boolean;
  leftPercent: number;
  widthPercent: number;
  onSelect: () => void;
  resizePreview: ResizePreview;
  duration: number;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `subtitle-${clip.id}`,
      data: { type: "subtitle", clip },
    });

  // Apply resize preview
  let previewLeft = leftPercent;
  let previewWidth = widthPercent;
  const isResizing = resizePreview && resizePreview.id === clip.id;

  if (isResizing && resizePreview) {
    const deltaPercent = (resizePreview.deltaMs / duration) * 100;
    if (resizePreview.edge === "start") {
      previewLeft = Math.max(0, leftPercent + deltaPercent);
      previewWidth = Math.max(1, widthPercent - deltaPercent);
    } else {
      previewWidth = Math.max(1, widthPercent + deltaPercent);
    }
  }

  const style = {
    left: `${previewLeft}%`,
    width: `${previewWidth}%`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging || isResizing ? 50 : isSelected ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute h-10 rounded flex items-center overflow-visible transition-shadow border group ${
        isSelected
          ? "bg-amber-400 border-amber-500 shadow-lg"
          : "bg-amber-300 border-amber-400 hover:bg-amber-400"
      } ${isDragging ? "shadow-xl cursor-grabbing" : ""}`}
      style={style}
    >
      {/* Resize handles (cursor changes on hover) */}
      <ResizeHandle id={`subtitle-resize-start-${clip.id}`} edge="start" clip={clip} />
      <ResizeHandle id={`subtitle-resize-end-${clip.id}`} edge="end" clip={clip} />

      {/* Draggable content area */}
      <div
        {...attributes}
        {...listeners}
        className="flex-1 h-full flex items-center px-2 cursor-grab active:cursor-grabbing overflow-hidden"
      >
        <span className="text-sm text-amber-900 truncate select-none font-medium">
          {clip.text}
        </span>
      </div>
    </div>
  );
}

// Draggable Audio Clip
function DraggableAudioClip({
  clip,
  isSelected,
  leftPercent,
  widthPercent,
  onSelect,
}: {
  clip: AudioClip;
  isSelected: boolean;
  leftPercent: number;
  widthPercent: number;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `audio-${clip.id}`,
      data: { type: "audio", clip },
    });

  const style = {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 50 : isSelected ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute h-10 rounded cursor-grab active:cursor-grabbing flex items-center px-1 overflow-hidden transition-shadow border ${
        isSelected
          ? "bg-teal-400 border-teal-500 shadow-lg"
          : "bg-teal-300 border-teal-400 hover:bg-teal-400"
      } ${isDragging ? "shadow-xl" : ""}`}
      style={style}
    >
      <span className="text-xs text-teal-900 truncate select-none font-medium">
        {clip.status === "generating" ? "..." : clip.text || "♪"}
      </span>
    </div>
  );
}

const TRACK_LABEL_WIDTH = 70;

export function Timeline({
  duration,
  currentTime,
  subtitles,
  audioClips,
  selectedSubtitle,
  selectedAudio,
  onSeek,
  onSelectSubtitle,
  onSelectAudio,
  onAddSubtitle,
  onAddAudio,
  onMoveSubtitle,
  onMoveAudio,
  onResizeSubtitle,
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [resizePreview, setResizePreview] = useState<ResizePreview>(null);
  // ズームレベル: 1 = 全体表示、2 = 2倍拡大、など
  const [zoom, setZoom] = useState(4); // デフォルトは4倍拡大

  // Pointer sensor with activation constraint
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Track container width
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);


  const trackWidth = containerWidth - TRACK_LABEL_WIDTH;
  const zoomedTrackWidth = trackWidth * zoom;

  // Convert pixel to ms for drag (ズーム適用済みの幅を使用)
  const pxToMs = useCallback(
    (px: number) => {
      return (px / zoomedTrackWidth) * duration;
    },
    [zoomedTrackWidth, duration]
  );

  const handleDragMove = useCallback(
    (event: DragMoveEvent) => {
      const { active, delta } = event;
      const data = active.data.current;

      if (data?.type === "resize-subtitle") {
        const clip = data.clip as SubtitleClip;
        const edge = data.edge as "start" | "end";
        const deltaMs = pxToMs(delta.x);
        setResizePreview({ id: clip.id, edge, deltaMs });
      }
    },
    [pxToMs]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setResizePreview(null);

      const { active, delta } = event;
      const data = active.data.current;

      if (!data) return;

      const timeDelta = pxToMs(delta.x);

      if (data.type === "subtitle") {
        const clip = data.clip as SubtitleClip;
        const newStartTime = Math.max(
          0,
          Math.min(
            duration - (clip.endTime - clip.startTime),
            clip.startTime + timeDelta
          )
        );
        onMoveSubtitle(clip.id, newStartTime);
      } else if (data.type === "resize-subtitle" && onResizeSubtitle) {
        const clip = data.clip as SubtitleClip;
        const edge = data.edge as "start" | "end";
        const minDuration = 500; // 最小0.5秒

        if (edge === "start") {
          const newStartTime = Math.max(0, Math.min(clip.endTime - minDuration, clip.startTime + timeDelta));
          onResizeSubtitle(clip.id, newStartTime, clip.endTime);
        } else {
          const newEndTime = Math.max(clip.startTime + minDuration, Math.min(duration, clip.endTime + timeDelta));
          onResizeSubtitle(clip.id, clip.startTime, newEndTime);
        }
      } else if (data.type === "audio") {
        const clip = data.clip as AudioClip;
        const newStartTime = Math.max(
          0,
          Math.min(duration - clip.duration, clip.startTime + timeDelta)
        );
        onMoveAudio(clip.id, newStartTime);
      }
    },
    [duration, pxToMs, onMoveSubtitle, onMoveAudio, onResizeSubtitle]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const container = scrollContainerRef.current;
      if (!container) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      // ズーム適用済みの幅に対する割合
      const zoomedWidth = rect.width;
      const percentage = x / zoomedWidth;
      const newTime = percentage * duration;
      onSeek(Math.max(0, Math.min(duration, newTime)));
    },
    [duration, onSeek]
  );

  // ホイールでズーム調整（Ctrl/Cmd + wheel）- passive: false で登録
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        setZoom((prev) => Math.max(1, Math.min(20, prev + delta)));
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // Time markers - ズームに応じて間隔を調整
  const durationSec = duration / 1000;
  const effectiveDuration = durationSec / zoom; // ズーム後の見かけの duration
  let interval: number;
  if (effectiveDuration <= 10) interval = 1;
  else if (effectiveDuration <= 30) interval = 5;
  else if (effectiveDuration <= 60) interval = 10;
  else if (effectiveDuration <= 180) interval = 30;
  else interval = 60;

  const markers = [];
  for (let t = 0; t <= duration; t += interval * 1000) {
    markers.push(t);
  }

  const playheadPercent = (currentTime / duration) * 100;

  return (
    <div
      ref={containerRef}
      className="bg-white border-t border-slate-200 flex flex-col"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onAddSubtitle}
            className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-medium rounded hover:bg-amber-200 transition-colors border border-amber-200"
          >
            + 字幕
          </button>
          <button
            onClick={onAddAudio}
            className="px-3 py-1.5 bg-teal-100 text-teal-700 text-xs font-medium rounded hover:bg-teal-200 transition-colors border border-teal-200"
          >
            + 読み上げ
          </button>
        </div>
        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoom((prev) => Math.max(1, prev - 1))}
              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              title="縮小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-xs text-slate-500 font-mono w-8 text-center">{zoom}x</span>
            <button
              onClick={() => setZoom((prev) => Math.min(20, prev + 1))}
              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
              title="拡大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <span className="text-sm text-slate-600 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Timeline Area */}
      <DndContext sensors={sensors} onDragMove={handleDragMove} onDragEnd={handleDragEnd}>
        <div className="flex flex-1">
          {/* Track Labels (Fixed) */}
          <div
            className="flex-shrink-0 bg-slate-50 border-r border-slate-200"
            style={{ width: TRACK_LABEL_WIDTH }}
          >
            {/* Time ruler label */}
            <div className="h-8 border-b border-slate-200" />
            {/* Video track label */}
            <div className="h-12 flex items-center px-2 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium">動画</span>
            </div>
            {/* Subtitle track label */}
            <div className="h-14 flex items-center px-2 border-b border-slate-100">
              <span className="text-xs text-amber-600 font-medium">字幕</span>
            </div>
            {/* Audio track label */}
            <div className="h-14 flex items-center px-2">
              <span className="text-xs text-teal-600 font-medium">読み上げ</span>
            </div>
          </div>

          {/* Scrollable Tracks Area */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-x-auto overflow-y-hidden"
          >
            {/* Zoomed inner container */}
            <div className="relative" style={{ width: `${zoom * 100}%`, minWidth: '100%' }}>
              {/* Time Ruler */}
              <div className="h-8 border-b border-slate-200 relative bg-slate-50 overflow-hidden">
                {markers.map((time, index) => {
                  const percent = (time / duration) * 100;
                  const isFirst = index === 0;
                  const isLast = index === markers.length - 1;
                  return (
                    <div
                      key={time}
                      className="absolute bottom-0 h-full flex flex-col justify-end"
                      style={{ left: `${percent}%` }}
                    >
                      {/* 縦線は正確な位置 */}
                      <div className="absolute bottom-0 left-0 h-3 w-px bg-slate-300 -translate-x-1/2" />
                      {/* テキストは端でははみ出さないように調整 */}
                      <span
                        className="text-[11px] text-slate-400 whitespace-nowrap mb-3"
                        style={{
                          transform: isFirst ? 'translateX(0)' : isLast ? 'translateX(-100%)' : 'translateX(-50%)',
                        }}
                      >
                        {formatTime(time)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Video Track */}
              <div
                className="h-12 border-b border-slate-100 relative px-1 flex items-center cursor-pointer"
                onClick={handleTrackClick}
              >
                <div className="h-9 w-full bg-blue-200 border border-blue-300 rounded" />
              </div>

              {/* Subtitle Track */}
              <div
                className="h-14 border-b border-slate-100 relative flex items-center cursor-pointer"
                onClick={handleTrackClick}
              >
                {subtitles.map((subtitle) => {
                  const leftPercent = (subtitle.startTime / duration) * 100;
                  const widthPercent =
                    ((subtitle.endTime - subtitle.startTime) / duration) * 100;
                  return (
                    <DraggableSubtitleClip
                      key={subtitle.id}
                      clip={subtitle}
                      isSelected={selectedSubtitle === subtitle.id}
                      leftPercent={leftPercent}
                      widthPercent={widthPercent}
                      onSelect={() => onSelectSubtitle(subtitle.id)}
                      resizePreview={resizePreview}
                      duration={duration}
                    />
                  );
                })}
              </div>

              {/* Audio Track */}
              <div
                className="h-14 relative flex items-center cursor-pointer"
                onClick={handleTrackClick}
              >
                {audioClips.map((audio) => {
                  const leftPercent = (audio.startTime / duration) * 100;
                  const widthPercent = (audio.duration / duration) * 100;
                  return (
                    <DraggableAudioClip
                      key={audio.id}
                      clip={audio}
                      isSelected={selectedAudio === audio.id}
                      leftPercent={leftPercent}
                      widthPercent={widthPercent}
                      onSelect={() => onSelectAudio(audio.id)}
                    />
                  );
                })}
              </div>

            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-40"
              style={{ left: `${playheadPercent}%` }}
            >
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-red-500 rotate-45" />
            </div>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
