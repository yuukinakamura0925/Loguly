"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { SunIcon, MoonIcon } from "@/components/icons";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-slate-800 dark:bg-slate-700">
        <div className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-[0.9] transition-all"
      title={theme === "dark" ? "ライトモードに切替" : "ダークモードに切替"}
    >
      {theme === "dark" ? (
        <SunIcon className="w-5 h-5 text-amber-400" />
      ) : (
        <MoonIcon className="w-5 h-5 text-slate-700" />
      )}
    </button>
  );
}
