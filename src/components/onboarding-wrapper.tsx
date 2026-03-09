"use client";

import { useState, useCallback } from "react";
import OnboardingTour from "./onboarding-tour";

type Props = {
  role: "org_admin" | "member";
  showTour: boolean;
  completeAction: () => Promise<void>;
};

export function OnboardingWrapper({ role, showTour, completeAction }: Props) {
  const [visible, setVisible] = useState(showTour);

  const handleComplete = useCallback(async () => {
    setVisible(false);
    await completeAction();
  }, [completeAction]);

  if (!visible) return null;

  return <OnboardingTour role={role} onComplete={handleComplete} />;
}
