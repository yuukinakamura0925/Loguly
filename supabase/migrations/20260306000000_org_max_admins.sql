-- organizations に max_org_admins カラムを追加（デフォルト1）
ALTER TABLE organizations ADD COLUMN max_org_admins INTEGER NOT NULL DEFAULT 1;
