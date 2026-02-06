-- Loguly シードデータ（冪等: 何度実行してもOK）

-- ========================================
-- 既存auth.usersからprofileを作成（最初のユーザーをplatform_adminに）
-- ========================================
INSERT INTO profiles (id, email, display_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  'platform_admin'
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (id) DO UPDATE SET role = 'platform_admin';

-- 残りのユーザーはmemberとして作成
INSERT INTO profiles (id, email, display_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'display_name', email),
  'member'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- カテゴリ
-- ========================================
INSERT INTO categories (name, display_order) VALUES
  ('コンプライアンス', 1),
  ('情報セキュリティ', 2),
  ('ハラスメント防止', 3),
  ('新入社員研修', 4)
ON CONFLICT DO NOTHING;

-- ========================================
-- 動画（cf_video_id はダミー）
-- ========================================
INSERT INTO videos (category_id, title, description, cf_video_id, duration, display_order, is_published) VALUES
  (1, 'コンプライアンス基礎研修', 'コンプライアンスの基本的な考え方と重要性について学びます。', 'dummy-cf-id-001', 1800, 1, true),
  (1, '内部通報制度の理解', '内部通報制度の仕組みと利用方法を解説します。', 'dummy-cf-id-002', 1200, 2, true),
  (2, '情報セキュリティ入門', 'パスワード管理やフィッシング対策の基礎を学びます。', 'dummy-cf-id-003', 2400, 1, true),
  (2, 'リモートワークのセキュリティ', '在宅勤務時のセキュリティ対策を解説します。', 'dummy-cf-id-004', 1500, 2, true),
  (3, 'ハラスメント防止研修', '職場におけるハラスメントの定義と防止策を学びます。', 'dummy-cf-id-005', 2700, 1, true),
  (4, 'ビジネスマナー基礎', '社会人として必要な基本マナーを習得します。', 'dummy-cf-id-006', 1800, 1, true),
  (4, '報連相の基本', '報告・連絡・相談の重要性と実践方法を学びます。', 'dummy-cf-id-007', 900, 2, false)
ON CONFLICT DO NOTHING;

-- ========================================
-- 組織
-- ========================================
INSERT INTO organizations (id, name, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001', '株式会社テスト', 'test-corp'),
  ('a0000000-0000-0000-0000-000000000002', 'サンプル商事', 'sample-shoji')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- 組織メンバー（2人目以降のユーザーをテスト組織に割当）
-- ========================================

-- 2人目のユーザー → 株式会社テストの org_admin
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  id,
  'org_admin'
FROM auth.users
ORDER BY created_at ASC
OFFSET 1 LIMIT 1
ON CONFLICT DO NOTHING;

-- 2人目の profiles.role も org_admin に更新
UPDATE profiles SET role = 'org_admin'
WHERE id = (SELECT id FROM auth.users ORDER BY created_at ASC OFFSET 1 LIMIT 1);

-- 3人目のユーザー → 株式会社テストの member
INSERT INTO organization_members (organization_id, user_id, role)
SELECT
  'a0000000-0000-0000-0000-000000000001',
  id,
  'member'
FROM auth.users
ORDER BY created_at ASC
OFFSET 2 LIMIT 1
ON CONFLICT DO NOTHING;

-- ========================================
-- ライセンス（テスト組織に動画を割当）
-- ========================================
INSERT INTO organization_licenses (organization_id, video_id, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, true),
  ('a0000000-0000-0000-0000-000000000001', 2, true),
  ('a0000000-0000-0000-0000-000000000001', 3, true),
  ('a0000000-0000-0000-0000-000000000001', 5, true),
  ('a0000000-0000-0000-0000-000000000002', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 6, true)
ON CONFLICT DO NOTHING;
