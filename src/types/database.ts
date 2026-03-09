// ========================================
// Database Types
// ========================================

export type Role = "platform_admin" | "org_admin" | "member";

export type Profile = {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: Role;
  is_active: boolean;
  terms_accepted_at: string | null;
  onboarding_completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  max_org_admins: number;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  id: string;
  organization_id: string;
  user_id: string;
  role: "org_admin" | "member";
  joined_at: string;
};

export type OrganizationLicense = {
  id: string;
  organization_id: string;
  video_id: number;
  display_order: number | null;
  label: string | null;
  label_color: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type Video = {
  id: number;
  category_id: number;
  title: string;
  description: string | null;
  cf_video_id: string;
  duration: number;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ViewLog = {
  id: number;
  user_id: string;
  video_id: number;
  max_watched_seconds: number;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrgCategoryOrder = {
  id: string;
  organization_id: string;
  category_id: number;
  display_order: number;
};

export type Invitation = {
  id: string;
  organization_id: string;
  email: string;
  role: "org_admin" | "member";
  token: string;
  invited_by: string;
  accepted_at: string | null;
  email_sent_at: string | null;
  expires_at: string;
  created_at: string;
};
