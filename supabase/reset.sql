-- Loguly データリセット用SQL
-- リモートDB用: 全テーブル・関数・トリガーを削除

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS auth_org_id() CASCADE;
DROP FUNCTION IF EXISTS auth_role() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS organization_licenses CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS view_logs CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- auth.users も全削除（handle_new_user トリガーで profile が再作成されるため）
DELETE FROM auth.users;

-- supabase_migrations をクリアしてマイグレーション再適用可能にする
TRUNCATE supabase_migrations.schema_migrations;
