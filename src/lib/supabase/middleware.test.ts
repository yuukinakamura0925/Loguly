import { describe, it, expect } from "vitest";

// ミドルウェアのルーティングロジックを純粋関数としてテスト
// 実際のSupabase/Next.jsに依存しない部分を検証

type Role = "platform_admin" | "org_admin" | "member";

/**
 * ミドルウェアのルーティング判定ロジック（middleware.tsから抽出）
 */
function getRouteDecision(
  pathname: string,
  user: { id: string } | null,
  role: Role | null
): { action: "allow" | "redirect"; redirectTo?: string } {
  // 認証コールバック・パスワードリセットはそのまま通す
  if (
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/reset-password")
  ) {
    return { action: "allow" };
  }

  const protectedRoutes = ["/dashboard", "/watch", "/org"];
  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin-login";
  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    isAdminRoute;

  // 未認証ユーザーを保護されたルートからリダイレクト
  if (!user && isProtectedRoute) {
    return { action: "redirect", redirectTo: "/login" };
  }

  if (user && isProtectedRoute) {
    // /admin/* は platform_admin のみ
    if (pathname.startsWith("/admin") && role !== "platform_admin") {
      return { action: "redirect", redirectTo: "/dashboard" };
    }

    // /org/* は org_admin のみ
    if (pathname.startsWith("/org") && role !== "org_admin") {
      return {
        action: "redirect",
        redirectTo: role === "platform_admin" ? "/admin" : "/dashboard",
      };
    }

    // /dashboard, /watch は org_admin または member
    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/watch")) &&
      role === "platform_admin"
    ) {
      return { action: "redirect", redirectTo: "/admin" };
    }
  }

  // 認証済みユーザーをログインページからロールに応じてリダイレクト
  if (user && (pathname === "/login" || pathname === "/admin-login")) {
    if (role === "platform_admin") {
      return { action: "redirect", redirectTo: "/admin" };
    } else if (role === "org_admin") {
      return { action: "redirect", redirectTo: "/org/members" };
    } else {
      return { action: "redirect", redirectTo: "/dashboard" };
    }
  }

  return { action: "allow" };
}

describe("ミドルウェア ルーティングロジック", () => {
  // 公開ページ
  describe("公開ページ", () => {
    it("トップページは誰でもアクセス可能", () => {
      expect(getRouteDecision("/", null, null)).toEqual({ action: "allow" });
    });

    it("ログインページは未認証ユーザーがアクセス可能", () => {
      expect(getRouteDecision("/login", null, null)).toEqual({
        action: "allow",
      });
    });

    it("/auth/callbackはそのまま通す", () => {
      expect(getRouteDecision("/auth/callback", null, null)).toEqual({
        action: "allow",
      });
    });

    it("/reset-passwordはそのまま通す", () => {
      expect(getRouteDecision("/reset-password", null, null)).toEqual({
        action: "allow",
      });
    });

    it("/reset-password/updateはそのまま通す", () => {
      expect(getRouteDecision("/reset-password/update", null, null)).toEqual({
        action: "allow",
      });
    });
  });

  // 未認証ユーザーの保護ルートアクセス
  describe("未認証ユーザー → 保護ルート", () => {
    const routes = [
      "/dashboard",
      "/watch/123",
      "/org/members",
      "/org/settings",
      "/admin",
      "/admin/organizations",
      "/admin/videos",
    ];

    routes.forEach((route) => {
      it(`${route} → /login にリダイレクト`, () => {
        expect(getRouteDecision(route, null, null)).toEqual({
          action: "redirect",
          redirectTo: "/login",
        });
      });
    });

    it("/admin-login は保護ルートではない", () => {
      expect(getRouteDecision("/admin-login", null, null)).toEqual({
        action: "allow",
      });
    });
  });

  // platform_admin のルーティング
  describe("platform_admin", () => {
    const user = { id: "admin-1" };
    const role: Role = "platform_admin";

    it("/admin にアクセス可能", () => {
      expect(getRouteDecision("/admin", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/admin/organizations にアクセス可能", () => {
      expect(getRouteDecision("/admin/organizations", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/dashboard → /admin にリダイレクト", () => {
      expect(getRouteDecision("/dashboard", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/admin",
      });
    });

    it("/watch/123 → /admin にリダイレクト", () => {
      expect(getRouteDecision("/watch/123", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/admin",
      });
    });

    it("/org/members → /admin にリダイレクト", () => {
      expect(getRouteDecision("/org/members", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/admin",
      });
    });

    it("/login → /admin にリダイレクト", () => {
      expect(getRouteDecision("/login", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/admin",
      });
    });
  });

  // org_admin のルーティング
  describe("org_admin", () => {
    const user = { id: "org-admin-1" };
    const role: Role = "org_admin";

    it("/org/members にアクセス可能", () => {
      expect(getRouteDecision("/org/members", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/org/settings にアクセス可能", () => {
      expect(getRouteDecision("/org/settings", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/admin → /dashboard にリダイレクト", () => {
      expect(getRouteDecision("/admin", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/dashboard",
      });
    });

    it("/login → /org/members にリダイレクト", () => {
      expect(getRouteDecision("/login", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/org/members",
      });
    });
  });

  // member のルーティング
  describe("member", () => {
    const user = { id: "member-1" };
    const role: Role = "member";

    it("/dashboard にアクセス可能", () => {
      expect(getRouteDecision("/dashboard", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/watch/123 にアクセス可能", () => {
      expect(getRouteDecision("/watch/123", user, role)).toEqual({
        action: "allow",
      });
    });

    it("/admin → /dashboard にリダイレクト", () => {
      expect(getRouteDecision("/admin", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/dashboard",
      });
    });

    it("/org/members → /dashboard にリダイレクト", () => {
      expect(getRouteDecision("/org/members", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/dashboard",
      });
    });

    it("/login → /dashboard にリダイレクト", () => {
      expect(getRouteDecision("/login", user, role)).toEqual({
        action: "redirect",
        redirectTo: "/dashboard",
      });
    });
  });
});
