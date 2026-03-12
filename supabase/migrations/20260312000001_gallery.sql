-- 画像保管庫テーブル
CREATE TABLE gallery_images (
  id BIGSERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_type TEXT NOT NULL,
  width INT,
  height INT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- platform_adminのみ全操作
CREATE POLICY "platform_admin_full_access_gallery"
  ON gallery_images FOR ALL
  USING (auth_role() = 'platform_admin');

-- Supabase Storage バケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: platform_adminのみアップロード・削除
CREATE POLICY "platform_admin_upload_gallery"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND auth_role() = 'platform_admin');

CREATE POLICY "platform_admin_delete_gallery"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND auth_role() = 'platform_admin');

-- 誰でも閲覧可（publicバケット）
CREATE POLICY "public_read_gallery"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');
