import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProfileRole } from "@/lib/db";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // リダイレクト時も更新・削除された認証Cookieをブラウザへ返す。
  function redirectTo(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    for (const header of ["cache-control", "expires", "pragma"]) {
      const value = supabaseResponse.headers.get(header);
      if (value) response.headers.set(header, value);
    }
    return response;
  }

  // 認証コールバック・パスワードリセットはそのまま通す
  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/reset-password")) {
    return supabaseResponse;
  }

  // 保護されたルート（/admin-loginは除外）
  const protectedRoutes = ["/dashboard", "/watch", "/org"];
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin-login";
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  ) || isAdminRoute;

  // 未認証ユーザーを保護されたルートからリダイレクト
  if (!user && isProtectedRoute) {
    return redirectTo("/login");
  }

  if (user && isProtectedRoute) {
    // ロールを取得してアクセス制御
    const { data: profile } = await getProfileRole(supabase, user.id);

    const role = profile?.role;
    if (!role) return redirectTo("/account-unavailable");

    // /admin/* は platform_admin のみ
    if (pathname.startsWith("/admin") && role !== "platform_admin") {
      return redirectTo("/dashboard");
    }

    // /org/* は org_admin のみ
    if (pathname.startsWith("/org") && role !== "org_admin") {
      return redirectTo(role === "platform_admin" ? "/admin" : "/dashboard");
    }

    // /dashboard, /watch は org_admin または member
    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/watch")) &&
      role === "platform_admin"
    ) {
      return redirectTo("/admin");
    }
  }

  // 認証済みユーザーをログインページからロールに応じてリダイレクト
  if (user && (pathname === "/login" || pathname === "/admin-login")) {
    const { data: profile } = await getProfileRole(supabase, user.id);

    if (!profile?.role) return redirectTo("/account-unavailable");
    if (profile?.role === "platform_admin") {
      return redirectTo("/admin");
    } else if (profile?.role === "org_admin") {
      return redirectTo("/org/members");
    } else {
      return redirectTo("/dashboard");
    }
  }

  return supabaseResponse;
}
