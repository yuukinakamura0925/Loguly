import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "./middleware";

const mocks = vi.hoisted(() => ({
  user: { id: "user-1" } as { id: string } | null,
  role: "org_admin" as string | null,
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: {
    cookies: { setAll: (cookies: { name: string; value: string; options: { path: string; httpOnly: boolean } }[]) => void };
  }) => ({
    auth: {
      getUser: async () => {
        options.cookies.setAll([{
          name: "test-session", value: mocks.user ? "refreshed" : "",
          options: { path: "/", httpOnly: true },
        }]);
        return { data: { user: mocks.user } };
      },
    },
  }),
}));

vi.mock("@/lib/db", () => ({
  getProfileRole: async () => ({ data: mocks.role ? { role: mocks.role } : null }),
}));

describe("updateSession regression", () => {
  beforeEach(() => {
    mocks.user = { id: "user-1" };
    mocks.role = "org_admin";
  });

  it.each([
    ["/login", "org_admin", "/org/members"],
    ["/admin", "member", "/dashboard"],
    ["/org/members", "platform_admin", "/admin"],
    ["/dashboard", "platform_admin", "/admin"],
  ])("preserves refreshed cookies on %s redirects", async (path, role, destination) => {
    mocks.role = role;
    const response = await updateSession(new NextRequest(`https://example.com${path}`));
    expect(response.headers.get("location")).toBe(`https://example.com${destination}`);
    expect(response.cookies.get("test-session")).toMatchObject({ value: "refreshed", path: "/", httpOnly: true });
  });

  it("returns cleared cookies when an unauthenticated user is redirected", async () => {
    mocks.user = null;
    const response = await updateSession(new NextRequest("https://example.com/org/members"));
    expect(response.headers.get("location")).toBe("https://example.com/login");
    expect(response.cookies.get("test-session")?.value).toBe("");
  });

  it.each(["/login", "/admin", "/org/members", "/dashboard"])("stops missing-profile redirects from %s at an accessible page", async (path) => {
    mocks.role = null;
    const response = await updateSession(new NextRequest(`https://example.com${path}`));
    expect(response.headers.get("location")).toBe("https://example.com/account-unavailable");
    const terminal = await updateSession(new NextRequest(response.headers.get("location")!));
    expect(terminal.headers.get("location")).toBeNull();
    expect(terminal.status).toBe(200);
  });

  it("does not redirect the recovery page back to an organization without membership", async () => {
    const response = await updateSession(new NextRequest("https://example.com/account-unavailable"));
    expect(response.headers.get("location")).toBeNull();
  });
});
