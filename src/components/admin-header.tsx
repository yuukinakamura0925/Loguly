"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/app/dashboard/logout-button";
import { SettingsIcon } from "@/components/icons";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { adminNavItems } from "@/components/admin-sidebar";

interface AdminHeaderProps {
  displayName: string;
  avatarUrl?: string | null;
}

export function AdminHeader({ displayName, avatarUrl }: AdminHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const sidebarHeader = (
    <Link href="/admin" className="flex items-center gap-3">
      <div className="w-9 h-9 bg-da-blue-900 rounded-xl flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
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
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 bg-da-blue-900 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              {displayName?.charAt(0) || "A"}
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</div>
            <div className="text-xs text-slate-500">Platform Admin</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
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
