"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";
import LogoutButton from "@/app/dashboard/logout-button";
import { SettingsIcon, MenuIcon, BuildingIcon } from "@/components/icons";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { orgNavItems } from "@/components/org-sidebar";

interface OrgHeaderProps {
  displayName: string;
  orgName: string;
  avatarUrl?: string | null;
}

export function OrgHeader({ displayName, orgName, avatarUrl }: OrgHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const sidebarHeader = (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 bg-da-blue-900 rounded-xl flex items-center justify-center">
        <BuildingIcon className="w-5 h-5 text-white" strokeWidth={2} />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900 dark:text-white truncate max-w-[160px]">{orgName}</div>
        <div className="text-xs text-slate-500">組織管理</div>
      </div>
    </div>
  );

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <Link href="/settings" title="アカウント設定">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-8 h-8 bg-da-blue-900 rounded-lg flex items-center justify-center text-white text-sm font-bold hover:opacity-80 transition-opacity">
                {displayName?.charAt(0) || "U"}
              </div>
            )}
          </Link>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</div>
            <div className="text-xs text-slate-500">組織管理者</div>
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
        navItems={orgNavItems}
        header={sidebarHeader}
        isActive={(href, pathname) => pathname.startsWith(href)}
      />
    </>
  );
}
