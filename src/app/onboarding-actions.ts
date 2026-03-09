"use server";

import { createClient } from "@/lib/supabase/server";
import { markOnboardingCompleted } from "@/lib/db";

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await markOnboardingCompleted(supabase, user.id);
}
