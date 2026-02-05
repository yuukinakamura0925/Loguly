import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // 保護されたルート
  const protectedRoutes = ["/dashboard", "/watch", "/admin", "/org"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // 未認証ユーザーを保護されたルートからリダイレクト
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute) {
    // ロールを取得してアクセス制御
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // /admin/* は platform_admin のみ
    if (pathname.startsWith("/admin") && role !== "platform_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // /org/* は org_admin のみ
    if (pathname.startsWith("/org") && role !== "org_admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "platform_admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(url);
    }

    // /dashboard, /watch は org_admin または member
    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/watch")) &&
      role === "platform_admin"
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // 認証済みユーザーをログインページからロールに応じてリダイレクト
  if (user && pathname === "/login") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const url = request.nextUrl.clone();
    if (profile?.role === "platform_admin") {
      url.pathname = "/admin";
    } else if (profile?.role === "org_admin") {
      url.pathname = "/org/members";
    } else {
      url.pathname = "/dashboard";
    }
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
