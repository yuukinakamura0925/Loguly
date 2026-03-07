-- cf_video_id を500文字に拡張（R2キーにUUID+ファイル名を含むため）
ALTER TABLE videos ALTER COLUMN cf_video_id TYPE VARCHAR(500);
