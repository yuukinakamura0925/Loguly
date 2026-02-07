"use client";

import { useState, useRef, useEffect } from "react";
import type { SubtitleClip, AudioClip } from "../page";

type PropertyPanelProps = {
  selectedSubtitle: SubtitleClip | undefined;
  selectedAudio: AudioClip | undefined;
  onUpdateSubtitle: (id: string, updates: Partial<SubtitleClip>) => void;
  onUpdateAudio: (id: string, updates: Partial<AudioClip>) => void;
  onDeleteSubtitle: (id: string) => void;
  onDeleteAudio: (id: string) => void;
  // 新規音声作成モード
  isCreatingAudio: boolean;
  onInsertAudio: (text: string, duration: number, startTime: number) => void;
  onCancelCreateAudio: () => void;
  currentTime: number;
};

function formatTimeInput(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((ms % 1000) / 100);
  return `${minutes}:${seconds.toString().padStart(2, "0")}.${tenths}`;
}

function parseTimeInput(value: string): number {
  const [minSec, ms] = value.split(".");
  const [min, sec] = minSec.split(":");
  return (
    (parseInt(min || "0") * 60 + parseInt(sec || "0")) * 1000 +
    parseInt(ms || "0") * 100
  );
}

// 1文字あたりのミリ秒（日本語読み上げ想定）
const MS_PER_CHAR = 120;

function calculateDuration(text: string): number {
  // 最小1秒、最大30秒
  const chars = text.length;
  const duration = Math.max(1000, Math.min(30000, chars * MS_PER_CHAR));
  return duration;
}

export function PropertyPanel({
  selectedSubtitle,
  selectedAudio,
  onUpdateSubtitle,
  onUpdateAudio,
  onDeleteSubtitle,
  onDeleteAudio,
  isCreatingAudio,
  onInsertAudio,
  onCancelCreateAudio,
  currentTime,
}: PropertyPanelProps) {
  // 既存の音声編集用
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 新規音声作成用のローカルstate
  const [draftText, setDraftText] = useState("");
  const [draftStartTime, setDraftStartTime] = useState(0);
  const [draftDuration, setDraftDuration] = useState(0);
  const [draftStatus, setDraftStatus] = useState<"input" | "generating" | "ready">("input");

  // 作成モード開始時に初期化
  useEffect(() => {
    if (isCreatingAudio) {
      setDraftText("");
      setDraftStartTime(currentTime);
      setDraftDuration(0);
      setDraftStatus("input");
    }
  }, [isCreatingAudio, currentTime]);

  // Clean up interval on unmount or audio change
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [selectedAudio?.id]);

  // 新規音声の生成
  async function handleGenerateDraft() {
    if (!draftText.trim()) return;

    setDraftStatus("generating");

    try {
      const estimatedDuration = calculateDuration(draftText);
      // 生成をシミュレート
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setDraftDuration(estimatedDuration);
      setDraftStatus("ready");
    } catch {
      setDraftStatus("input");
    }
  }

  // タイムラインに挿入
  function handleInsertDraft() {
    if (draftStatus !== "ready") return;
    onInsertAudio(draftText, draftDuration, draftStartTime);
  }

  // 既存音声の生成
  async function handleGenerateAudio() {
    if (!selectedAudio || !selectedAudio.text.trim()) return;

    setGeneratingAudio(true);
    onUpdateAudio(selectedAudio.id, { status: "generating" });

    try {
      const estimatedDuration = calculateDuration(selectedAudio.text);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onUpdateAudio(selectedAudio.id, {
        status: "ready",
        duration: estimatedDuration,
        audioUrl: `dummy-audio-${Date.now()}.mp3`,
      });
    } catch {
      onUpdateAudio(selectedAudio.id, { status: "error" });
    } finally {
      setGeneratingAudio(false);
    }
  }

  function handlePlayPreview() {
    if (!selectedAudio || selectedAudio.status !== "ready") return;

    if (isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
      setIsPlaying(false);
      setPlayProgress(0);
      return;
    }

    setIsPlaying(true);
    setPlayProgress(0);

    const duration = selectedAudio.duration;
    const startTime = Date.now();

    playIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setPlayProgress(progress);

      if (progress >= 100) {
        if (playIntervalRef.current) {
          clearInterval(playIntervalRef.current);
        }
        setIsPlaying(false);
        setPlayProgress(0);
      }
    }, 50);
  }

  const estimatedDuration = selectedAudio?.text
    ? calculateDuration(selectedAudio.text)
    : 0;

  const draftEstimatedDuration = draftText ? calculateDuration(draftText) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-700 flex-shrink-0">
        <h2 className="text-xs font-medium text-slate-500 uppercase tracking-wider">プロパティ</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {/* 新規音声作成モード */}
        {isCreatingAudio && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-teal-400">読み上げを作成</h3>
              <button
                onClick={onCancelCreateAudio}
                className="text-xs text-slate-500 hover:text-slate-300"
              >
                キャンセル
              </button>
            </div>

            {/* Step 1: テキスト入力 */}
            <div>
              <label className="block text-xs text-slate-500 mb-1">
                読み上げテキスト
              </label>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={4}
                placeholder="読み上げるテキストを入力..."
                disabled={draftStatus !== "input"}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm resize-none focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder-slate-500 disabled:opacity-50"
              />
              {draftText && draftStatus === "input" && (
                <div className="mt-1 text-xs text-slate-500">
                  {draftText.length}文字 → 約{(draftEstimatedDuration / 1000).toFixed(1)}秒
                </div>
              )}
            </div>

            {/* Step 2: 生成ボタン */}
            {draftStatus === "input" && (
              <button
                onClick={handleGenerateDraft}
                disabled={!draftText.trim()}
                className="w-full px-4 py-2.5 bg-teal-500 text-white text-sm rounded hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                音声を生成
              </button>
            )}

            {/* 生成中 */}
            {draftStatus === "generating" && (
              <div className="flex items-center justify-center gap-2 py-4 text-teal-400">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">生成中...</span>
              </div>
            )}

            {/* Step 3: 生成完了 → 開始位置設定 → 挿入 */}
            {draftStatus === "ready" && (
              <div className="space-y-4">
                <div className="p-3 bg-teal-900/50 border border-teal-700 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-teal-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      生成完了
                    </div>
                    <span className="text-xs text-slate-400">
                      {(draftDuration / 1000).toFixed(1)}秒
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    開始位置
                  </label>
                  <input
                    type="text"
                    value={formatTimeInput(draftStartTime)}
                    onChange={(e) => setDraftStartTime(parseTimeInput(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleInsertDraft}
                  className="w-full px-4 py-2.5 bg-teal-600 text-white text-sm rounded hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  タイムラインに追加
                </button>
              </div>
            )}
          </div>
        )}

        {/* 字幕編集 */}
        {!isCreatingAudio && selectedSubtitle && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-400">字幕</span>
              <button
                onClick={() => onDeleteSubtitle(selectedSubtitle.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                削除
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">テキスト</label>
              <input
                type="text"
                value={selectedSubtitle.text}
                onChange={(e) => onUpdateSubtitle(selectedSubtitle.id, { text: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:ring-1 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">開始</label>
                <input
                  type="text"
                  value={formatTimeInput(selectedSubtitle.startTime)}
                  onChange={(e) => onUpdateSubtitle(selectedSubtitle.id, { startTime: parseTimeInput(e.target.value) })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm font-mono focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-1">終了</label>
                <input
                  type="text"
                  value={formatTimeInput(selectedSubtitle.endTime)}
                  onChange={(e) => onUpdateSubtitle(selectedSubtitle.id, { endTime: parseTimeInput(e.target.value) })}
                  className="w-full px-2.5 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm font-mono focus:ring-1 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* 既存音声編集 */}
        {!isCreatingAudio && selectedAudio && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-teal-400">読み上げ</span>
              <button
                onClick={() => onDeleteAudio(selectedAudio.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                削除
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">テキスト</label>
              <input
                type="text"
                value={selectedAudio.text}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { text: e.target.value })}
                placeholder="読み上げるテキスト"
                className="w-full px-2.5 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm focus:ring-1 focus:ring-teal-500 focus:border-transparent placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">開始位置</label>
              <input
                type="text"
                value={formatTimeInput(selectedAudio.startTime)}
                onChange={(e) => onUpdateAudio(selectedAudio.id, { startTime: parseTimeInput(e.target.value) })}
                className="w-full px-2.5 py-2 bg-slate-900 border border-slate-600 rounded text-slate-100 text-sm font-mono focus:ring-1 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {selectedAudio.status === "ready" && (
              <div className="flex items-center gap-3 p-2 bg-slate-900 rounded border border-slate-700">
                <button
                  onClick={handlePlayPreview}
                  className="w-8 h-8 flex items-center justify-center bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors"
                >
                  {isPlaying ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-xs text-slate-400">プレビュー</div>
                  <div className="text-xs text-slate-500">{(selectedAudio.duration / 1000).toFixed(1)}秒</div>
                </div>
              </div>
            )}

            <button
              onClick={handleGenerateAudio}
              disabled={!selectedAudio.text.trim() || generatingAudio}
              className="w-full px-3 py-2 bg-teal-600 text-white text-sm rounded hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {generatingAudio ? (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              再生成
            </button>
          </div>
        )}

        {/* 何も選択されていない状態 */}
        {!isCreatingAudio && !selectedSubtitle && !selectedAudio && (
          <div className="flex items-center gap-2 text-slate-500 py-2">
            <svg
              className="w-4 h-4 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
            <p className="text-xs">クリップを選択して編集</p>
          </div>
        )}
      </div>
    </div>
  );
}
