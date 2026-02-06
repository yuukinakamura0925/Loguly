"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { upsertViewLog } from "@/lib/db";

type VideoData = {
  id: number;
  title: string;
  description: string | null;
  duration: number;
  cfVideoId: string;
  categoryName?: string;
};

type Progress = {
  maxWatchedSeconds: number;
  completed: boolean;
};

type Props = {
  video: VideoData;
  initialProgress: Progress;
  userId: string;
};

function formatTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function VideoPlayer({ video, initialProgress, userId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialProgress.maxWatchedSeconds);
  const [maxWatchedSeconds, setMaxWatchedSeconds] = useState(initialProgress.maxWatchedSeconds);
  const [completed, setCompleted] = useState(initialProgress.completed);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const supabase = createClient();
  const lastSavedRef = useRef(initialProgress.maxWatchedSeconds);
  const maxWatchedRef = useRef(initialProgress.maxWatchedSeconds);
  const completedRef = useRef(initialProgress.completed);

  // 進捗を保存
  const saveProgress = useCallback(async (seconds: number, isCompleted: boolean) => {
    // 前回保存から変化がない場合はスキップ
    if (seconds <= lastSavedRef.current && !isCompleted) return;

    lastSavedRef.current = seconds;

    const { error } = await upsertViewLog(supabase, {
      user_id: userId,
      video_id: video.id,
      max_watched_seconds: Math.floor(seconds),
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    });

    if (error) {
      console.error("Failed to save progress:", error.message, error.code, error.details);
    }
  }, [supabase, userId, video.id]);

  // Heartbeat: 5秒ごとに進捗を保存
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (maxWatchedSeconds > lastSavedRef.current) {
        saveProgress(maxWatchedSeconds, completed);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, maxWatchedSeconds, completed, saveProgress]);

  // 時間更新時の処理
  const handleTimeUpdate = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const time = videoEl.currentTime;
    setCurrentTime(time);

    // 未完了で未視聴区間にいる場合は戻す
    if (!completedRef.current && time > maxWatchedRef.current + 2) {
      videoEl.currentTime = maxWatchedRef.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 2000);
      return;
    }

    // 最大視聴秒数を更新
    if (time > maxWatchedRef.current) {
      maxWatchedRef.current = time;
      setMaxWatchedSeconds(time);

      // 90%視聴で完了
      if (!completedRef.current && time >= video.duration * 0.9) {
        completedRef.current = true;
        setCompleted(true);
        saveProgress(time, true);
      }
    }
  };

  // シーク時の処理（スキップ制限）
  const handleSeeking = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    // 完了済みなら制限なし
    if (completedRef.current) return;

    // 未視聴区間へのシークを禁止
    if (videoEl.currentTime > maxWatchedRef.current + 1) {
      videoEl.currentTime = maxWatchedRef.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 2000);
    }
  };

  // シーク完了時にも再チェック
  const handleSeeked = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (!completedRef.current && videoEl.currentTime > maxWatchedRef.current + 1) {
      videoEl.currentTime = maxWatchedRef.current;
      setShowSkipWarning(true);
      setTimeout(() => setShowSkipWarning(false), 2000);
    }
  };

  // ページ離脱時に保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProgress(maxWatchedSeconds, completed);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // コンポーネントアンマウント時にも保存
      saveProgress(maxWatchedSeconds, completed);
    };
  }, [maxWatchedSeconds, completed, saveProgress]);

  // 初期位置にシーク
  useEffect(() => {
    const videoEl = videoRef.current;
    if (videoEl && initialProgress.maxWatchedSeconds > 0) {
      videoEl.currentTime = initialProgress.maxWatchedSeconds;
    }
  }, [initialProgress.maxWatchedSeconds]);

  const progressPercent = (currentTime / video.duration) * 100;
  const maxProgressPercent = (maxWatchedSeconds / video.duration) * 100;

  return (
    <div className="space-y-4">
      {/* 動画プレイヤー */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          controls
          playsInline
        >
          {/* テスト用のサンプル動画 */}
          <source
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            type="video/mp4"
          />
          お使いのブラウザは動画再生に対応していません。
        </video>

        {/* スキップ警告 */}
        {showSkipWarning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            未視聴の部分はスキップできません
          </div>
        )}

        {/* 完了バッジ */}
        {completed && (
          <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
            ✓ 視聴完了
          </div>
        )}
      </div>

      {/* カスタムプログレスバー */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(video.duration)}</span>
        </div>
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          {/* 視聴可能範囲 */}
          <div
            className="absolute h-full bg-gray-600"
            style={{ width: `${maxProgressPercent}%` }}
          />
          {/* 現在位置 */}
          <div
            className="absolute h-full bg-blue-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <span>視聴済み: {formatTime(maxWatchedSeconds)}</span>
          <span>{Math.round(maxProgressPercent)}% 完了</span>
        </div>
      </div>

      {/* 動画情報 */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-sm text-blue-400">{video.categoryName}</span>
            <h2 className="text-xl font-bold text-white mt-1">{video.title}</h2>
            {video.description && (
              <p className="text-gray-400 mt-2">{video.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {Math.round(maxProgressPercent)}%
            </div>
            <div className="text-sm text-gray-400">視聴進捗</div>
          </div>
        </div>
      </div>

      {/* デバッグ情報（開発中のみ表示） */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-800 rounded-lg p-4 text-xs text-gray-500 font-mono">
          <div>currentTime: {currentTime.toFixed(1)}</div>
          <div>maxWatchedSeconds: {maxWatchedSeconds.toFixed(1)}</div>
          <div>completed: {completed.toString()}</div>
          <div>duration: {video.duration}</div>
        </div>
      )}
    </div>
  );
}
