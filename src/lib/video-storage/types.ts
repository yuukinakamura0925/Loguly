export interface UploadResult {
  /** R2: ファイルキー, Stream: video UID */
  videoId: string;
  /** クライアントが直接アップロードするURL */
  uploadUrl: string;
}

export interface VideoStorageProvider {
  /** 署名付きアップロードURL生成（サーバーサイド） */
  createUploadUrl(filename: string): Promise<UploadResult>;
  /** 動画IDから再生用URLを生成 */
  getPlaybackUrl(videoId: string): string;
  /** 動画IDからダウンロード元URLを生成（サーバー側プロキシ用） */
  getDownloadUrl(videoId: string): string;
  /** ストレージから動画ファイルを削除 */
  deleteVideo(videoId: string): Promise<void>;
}
