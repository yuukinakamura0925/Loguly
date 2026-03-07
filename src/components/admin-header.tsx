"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/app/dashboard/logout-button";
import { SettingsIcon, MenuIcon, CirclePlayIcon } from "@/components/icons";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { adminNavItems } from "@/components/admin-sidebar";

interface AdminHeaderProps {
  displayName: string;
}

export function AdminHeader({ displayName }: AdminHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const sidebarHeader = (
    <Link href="/admin" className="flex items-center gap-3">
      <div className="w-9 h-9 bg-da-blue-900 rounded-xl flex items-center justify-center">
        <CirclePlayIcon className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900 dark:text-white">Loguly</div>
        <div className="text-xs text-slate-500">Admin Panel</div>
      </div>
    </Link>
  );

  return (
    <>
      <header className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* ハンバーガーメニュー（モバイル/タブレット） */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 active:scale-[0.9] transition-all"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</div>
            <div className="text-xs text-slate-500">Platform Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-[0.9] transition-all"
            title="アカウント設定"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      <MobileSidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        navItems={adminNavItems}
        header={sidebarHeader}
        isActive={(href, pathname) =>
          href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
        }
      />
    </>
  );
}
