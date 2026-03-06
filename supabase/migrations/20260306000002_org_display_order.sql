-- 組織別カテゴリ・動画表示順

-- 動画の組織別表示順（既存テーブルにカラム追加）
ALTER TABLE organization_licenses ADD COLUMN display_order INTEGER;

-- カテゴリの組織別表示順
CREATE TABLE org_category_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  display_order INTEGER NOT NULL,
  UNIQUE(organization_id, category_id)
);

CREATE INDEX idx_org_category_order_org_id ON org_category_order(organization_id);

-- RLS
ALTER TABLE org_category_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_admin_manage_org_category_order"
  ON org_category_order FOR ALL
  USING (auth_role() = 'platform_admin');

CREATE POLICY "org_admin_manage_own_category_order"
  ON org_category_order FOR ALL
  USING (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  )
  WITH CHECK (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  );

CREATE POLICY "member_view_own_category_order"
  ON org_category_order FOR SELECT
  USING (organization_id = auth_org_id());

-- org_adminがorganization_licensesのdisplay_orderを更新できるようにする
CREATE POLICY "org_admin_update_own_licenses"
  ON organization_licenses FOR UPDATE
  USING (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  )
  WITH CHECK (
    auth_role() = 'org_admin'
    AND organization_id = auth_org_id()
  );
