/**
 * ビデオストレージのファクトリ
 *
 * 環境変数 VIDEO_STORAGE_PROVIDER で切り替え:
 *   "r2"     → Cloudflare R2（開発用、無料10GB）
 *   "stream" → Cloudflare Stream（本番用、HLS配信）
 *
 * アプリのコードは getVideoStorage() だけ呼べばよく、
 * 裏がR2かStreamかを意識する必要がない。
 */
import type { VideoStorageProvider } from "./types";
import { R2Provider } from "./r2-provider";
import { StreamProvider } from "./stream-provider";

export type { VideoStorageProvider, UploadResult } from "./types";

// シングルトン: 一度生成したらアプリの生存期間中使い回す
let provider: VideoStorageProvider | null = null;

export function getVideoStorage(): VideoStorageProvider {
  if (provider) return provider;

  const type = process.env.VIDEO_STORAGE_PROVIDER || "r2";

  switch (type) {
    case "stream":
      provider = new StreamProvider();
      break;
    case "r2":
    default:
      provider = new R2Provider();
      break;
  }

  return provider;
}
