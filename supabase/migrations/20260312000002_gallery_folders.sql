-- gallery_folders テーブル
CREATE TABLE gallery_folders (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gallery_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_full_access_gallery_folders"
  ON gallery_folders FOR ALL
  USING (auth_role() = 'platform_admin');

-- gallery_images に folder_id を追加（NULLは未分類）
ALTER TABLE gallery_images
  ADD COLUMN folder_id BIGINT REFERENCES gallery_folders(id) ON DELETE SET NULL;
