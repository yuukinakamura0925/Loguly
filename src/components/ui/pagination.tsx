import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string>;
};

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  if (totalPages <= 1) return null;

  function getPageUrl(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  }

  // Calculate visible page numbers
  const pages: (number | "...")[] = [];
  const showPages = 5;
  const halfShow = Math.floor(showPages / 2);

  let startPage = Math.max(1, currentPage - halfShow);
  let endPage = Math.min(totalPages, currentPage + halfShow);

  if (currentPage <= halfShow) {
    endPage = Math.min(totalPages, showPages);
  }
  if (currentPage > totalPages - halfShow) {
    startPage = Math.max(1, totalPages - showPages + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) pages.push("...");
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1">
      {/* Previous */}
      {currentPage > 1 ? (
        <Link
          href={getPageUrl(currentPage - 1)}
          className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>
      ) : (
        <span className="px-3 py-2 text-slate-300 dark:text-slate-700">
          <ChevronLeftIcon className="w-4 h-4" />
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page, index) =>
        page === "..." ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-slate-400">
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={getPageUrl(page)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              page === currentPage
                ? "bg-da-blue-900 text-white"
                : "text-da-gray-800 dark:text-slate-400 hover:bg-da-blue-50 dark:hover:bg-slate-800"
            }`}
          >
            {page}
          </Link>
        )
      )}

      {/* Next */}
      {currentPage < totalPages ? (
        <Link
          href={getPageUrl(currentPage + 1)}
          className="px-3 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Link>
      ) : (
        <span className="px-3 py-2 text-slate-300 dark:text-slate-700">
          <ChevronRightIcon className="w-4 h-4" />
        </span>
      )}
    </nav>
  );
}
