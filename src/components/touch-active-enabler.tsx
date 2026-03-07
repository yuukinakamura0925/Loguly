"use client";

import { useEffect } from "react";

/**
 * iOS Safari では touchstart リスナーがないと :active 疑似クラスが発火しない。
 * この空リスナーを登録することで、全要素の :active が正しく動作する。
 */
export function TouchActiveEnabler() {
  useEffect(() => {
    document.addEventListener("touchstart", () => {}, { passive: true });
  }, []);
  return null;
}
