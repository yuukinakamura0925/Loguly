import { expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
}));
vi.mock("@/lib/auth", () => ({
  requireRole: async () => ({ role: "org_admin" }),
  getCurrentOrg: async () => null,
}));
vi.mock("@/components/org-sidebar", () => ({ default: () => null }));
vi.mock("@/components/org-header", () => ({ OrgHeader: () => null }));
vi.mock("@/components/onboarding-wrapper", () => ({ OnboardingWrapper: () => null }));
vi.mock("@/app/onboarding-actions", () => ({ completeOnboarding: vi.fn() }));

import OrgLayout from "./layout";

it("sends an org admin without an organization to a stable recovery page", async () => {
  await expect(OrgLayout({ children: null })).rejects.toThrow("redirect:/account-unavailable");
});
