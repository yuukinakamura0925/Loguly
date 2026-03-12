-- 同じ階層（parent_id）に同名フォルダを禁止するユニーク制約
-- parent_id が NULL の場合も正しく動作するよう COALESCE を使用
CREATE UNIQUE INDEX gallery_folders_unique_name_per_parent
  ON gallery_folders (COALESCE(parent_id, 0), name);
