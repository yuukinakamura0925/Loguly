"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { markOnboardingCompleted } from "@/lib/db";

export async function completeOnboarding() {
  const profile = await requireAuth();
  const supabase = await createClient();
  await markOnboardingCompleted(supabase, profile.id);
}
