-- Loguly 初期スキーマ
-- 動画視聴ログ管理システム（マルチテナント対応）

-- ========================================
-- profiles（ユーザー情報）
-- ========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('platform_admin', 'org_admin', 'member')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- categories（カテゴリ）
-- ========================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- videos（動画）
-- ========================================
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  cf_video_id VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- view_logs（視聴ログ）
-- ========================================
CREATE TABLE view_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  max_watched_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- ========================================
-- organizations（組織）
-- ========================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- organization_members（組織メンバー）
-- ========================================
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('org_admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- ========================================
-- organization_licenses（組織の動画ライセンス）
-- ========================================
CREATE TABLE organization_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, video_id)
);

-- ========================================
-- invitations（招待）
-- ========================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('org_admin', 'member')),
  token VARCHAR(64) NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========================================
-- インデックス
-- ========================================
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_view_logs_user_id ON view_logs(user_id);
CREATE INDEX idx_view_logs_video_id ON view_logs(video_id);
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_licenses_org_id ON organization_licenses(organization_id);
CREATE INDEX idx_org_licenses_video_id ON organization_licenses(video_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_org_id ON invitations(organization_id);

-- ========================================
-- updated_at 自動更新トリガー
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER view_logs_updated_at
  BEFORE UPDATE ON view_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER org_licenses_updated_at
  BEFORE UPDATE ON organization_licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================
-- RLSヘルパー関数
-- ========================================

CREATE OR REPLACE FUNCTION auth_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- ----- profiles -----
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_full_access_profiles"
  ON profiles FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_admin_view_org_members"
  ON profiles FOR SELECT
  USING (
    auth_role() = 'org_admin'
    AND (
      id = auth.uid()
      OR id IN (
        SELECT om.user_id FROM organization_members om
        WHERE om.organization_id = auth_org_id()
      )
    )
  );

CREATE POLICY "member_view_own_profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ----- categories -----
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_categories"
  ON categories FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "authenticated_view_categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

-- ----- videos -----
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_videos"
  ON videos FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "licensed_users_view_videos"
  ON videos FOR SELECT
  USING (
    is_published = true
    AND id IN (
      SELECT ol.video_id FROM organization_licenses ol
      WHERE ol.organization_id = auth_org_id()
        AND ol.is_active = true
        AND (ol.expires_at IS NULL OR ol.expires_at > NOW())
    )
  );

-- ----- view_logs -----
ALTER TABLE view_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_view_logs"
  ON view_logs FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_admin_view_org_logs"
  ON view_logs FOR SELECT
  USING (
    auth_role() = 'org_admin'
    AND user_id IN (
      SELECT om.user_id FROM organization_members om
      WHERE om.organization_id = auth_org_id()
    )
  );

CREATE POLICY "member_view_own_logs"
  ON view_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "member_insert_own_logs"
  ON view_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "member_update_own_logs"
  ON view_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- ----- organizations -----
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_organizations"
  ON organizations FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_member_view_own_org"
  ON organizations FOR SELECT
  USING (id = auth_org_id());

CREATE POLICY "org_admin_update_own_org"
  ON organizations FOR UPDATE
  USING (
    auth_role() = 'org_admin'
    AND id = auth_org_id()
  )
  WITH CHECK (
    auth_role() = 'org_admin'
    AND id = auth_org_id()
  );

-- ----- organization_members -----
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_org_members"
  ON organization_members FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_admin_view_org_members_table"
  ON organization_members FOR SELECT
  USING (organization_id = auth_org_id());

CREATE POLICY "org_admin_insert_org_members"
  ON organization_members FOR INSERT
  WITH CHECK (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  );

CREATE POLICY "org_admin_delete_org_members"
  ON organization_members FOR DELETE
  USING (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
    AND user_id != auth.uid()
  );

CREATE POLICY "member_view_own_membership"
  ON organization_members FOR SELECT
  USING (user_id = auth.uid());

-- ----- organization_licenses -----
ALTER TABLE organization_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_licenses"
  ON organization_licenses FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_member_view_own_licenses"
  ON organization_licenses FOR SELECT
  USING (organization_id = auth_org_id());

-- ----- invitations -----
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_invitations"
  ON invitations FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_admin_manage_own_invitations"
  ON invitations FOR ALL
  USING (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  );

-- ========================================
-- 新規ユーザー登録時に profiles を自動作成
-- ========================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _invitation RECORD;
BEGIN
  -- 未使用の招待を確認
  SELECT * INTO _invitation
  FROM invitations
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF _invitation IS NOT NULL THEN
    -- 招待がある場合: 招待のロールでプロフィール作成
    INSERT INTO profiles (id, email, display_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      _invitation.role
    );

    -- 組織に追加
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (_invitation.organization_id, NEW.id, _invitation.role);

    -- 招待を受諾済みに更新
    UPDATE invitations SET accepted_at = NOW() WHERE id = _invitation.id;
  ELSE
    -- 招待がない場合: memberとしてプロフィール作成
    INSERT INTO profiles (id, email, display_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      'member'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
