"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { XIcon } from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  header: React.ReactNode;
  isActive: (href: string, pathname: string) => boolean;
}

export function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  header,
  isActive,
}: MobileSidebarProps) {
  const pathname = usePathname();

  // ページ遷移時に閉じる
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // スクロールロック
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* オーバーレイ */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* サイドバー */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-xl animate-slide-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          {header}
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive(item.href, pathname)
                  ? "bg-da-blue-50 dark:bg-da-blue-900/20 text-da-blue-900 dark:text-da-blue-200 font-semibold"
                  : "text-da-gray-600 dark:text-slate-400 hover:bg-da-blue-50 dark:hover:bg-slate-800/50 hover:text-da-blue-900 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-700/50"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}
