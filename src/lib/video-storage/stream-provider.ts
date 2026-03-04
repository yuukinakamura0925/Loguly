/**
 * Cloudflare Stream ストレージプロバイダー（本番用）
 *
 * R2と違い、アップロード後に自動でHLSトランスコード（画質別ファイル生成）される。
 * 視聴者の回線速度に応じて画質が自動調整される。
 * SDKは不要で、fetch()でREST APIを直接叩く。
 */
import type { VideoStorageProvider, UploadResult } from "./types";

const STREAM_API = "https://api.cloudflare.com/client/v4";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

function getAccountUrl() {
  return `${STREAM_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream`;
}

export class StreamProvider implements VideoStorageProvider {
  /**
   * Cloudflare Stream の "Direct Creator Upload" APIを使う
   *
   * ?direct_user=true を付けると、ブラウザから直接アップロードできるURLが返る。
   * R2のpresigned URLと同じ役割だが、Stream専用のエンドポイント。
   * アップロード完了後、Cloudflareが自動でHLSトランスコードを開始する。
   */
  async createUploadUrl(filename: string): Promise<UploadResult> {
    const res = await fetch(`${getAccountUrl()}?direct_user=true`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        maxDurationSeconds: 7200, // 最大2時間の動画を許可
        meta: { filename },
      }),
    });

    if (!res.ok) {
      throw new Error(`Stream API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    // uid: Stream内での動画ID、uploadURL: ブラウザからアップロードするURL
    const { uid, uploadURL } = data.result;

    return { videoId: uid, uploadUrl: uploadURL };
  }

  /**
   * HLS再生URL（.m3u8）を返す
   *
   * CLOUDFLARE_STREAM_CUSTOMER_CODE はStreamダッシュボードで確認できる。
   * HLSなのでブラウザで再生するには hls.js ライブラリが必要（将来対応）。
   */
  getPlaybackUrl(videoId: string): string {
    return `https://customer-${process.env.CLOUDFLARE_STREAM_CUSTOMER_CODE}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  }

  async deleteVideo(videoId: string): Promise<void> {
    const res = await fetch(`${getAccountUrl()}/${videoId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Stream API error: ${res.status} ${await res.text()}`);
    }
  }
}
