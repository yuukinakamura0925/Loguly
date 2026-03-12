-- gallery_folders にネストフォルダ対応の parent_id を追加
ALTER TABLE gallery_folders
  ADD COLUMN parent_id BIGINT REFERENCES gallery_folders(id) ON DELETE CASCADE;
