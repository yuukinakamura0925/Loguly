/**
 * Cloudflare R2 ストレージプロバイダー（開発用）
 *
 * R2はS3互換APIなので、AWS SDKをそのまま使える。
 * endpointをR2のURLに向けるだけでS3→R2に切り替わる仕組み。
 */
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { VideoStorageProvider, UploadResult } from "./types";

/** S3互換クライアントをR2エンドポイントに向けて生成 */
function getR2Client() {
  return new S3Client({
    region: "auto", // R2はリージョン不要だが、SDKの必須パラメータなので"auto"
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export class R2Provider implements VideoStorageProvider {
  /**
   * presigned PUT URLを生成する
   *
   * presigned URL = APIキーなしでアップロードできる「許可証付きURL」
   * ブラウザから直接R2にアップロードするために使う。
   * これがないと、動画ファイル（数百MB〜2GB）をNext.jsサーバー経由で
   * 送ることになり、Vercelのボディサイズ制限(4.5MB)に引っかかる。
   */
  async createUploadUrl(filename: string): Promise<UploadResult> {
    const client = getR2Client();
    // 拡張子だけ保持してUUIDベースのキーにする
    const ext = filename.includes(".") ? filename.slice(filename.lastIndexOf(".")) : "";
    const key = `videos/${crypto.randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    });

    // 有効期限1時間のpresigned URLを生成
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return { videoId: key, uploadUrl };
  }

  /** R2パブリックバケットのURLを組み立てるだけ（API呼び出し不要） */
  getPlaybackUrl(videoId: string): string {
    return `${process.env.R2_PUBLIC_URL}/${videoId}`;
  }

  async deleteVideo(videoId: string): Promise<void> {
    const client = getR2Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: videoId,
      })
    );
  }
}
