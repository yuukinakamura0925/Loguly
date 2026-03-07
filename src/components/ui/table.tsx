import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import { SortIcon, SortAscIcon, SortDescIcon } from "@/components/icons";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className = "", children, ...props }: TableProps) {
  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
      <table className={`w-full ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableHeader({ className = "", children, ...props }: TableHeaderProps) {
  return (
    <thead className={`bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-800/50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ className = "", children, ...props }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-slate-200 dark:divide-slate-800 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ className = "", children, ...props }: TableRowProps) {
  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${className}`} {...props}>
      {children}
    </tr>
  );
}

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableHead({ className = "", children, ...props }: TableHeadProps) {
  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children?: ReactNode;
}

export function TableCell({ className = "", children, ...props }: TableCellProps) {
  return (
    <td className={`px-4 py-4 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </td>
  );
}

interface TableEmptyProps {
  colSpan: number;
  message: string;
}

export function TableEmpty({ colSpan, message }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="text-slate-500">{message}</div>
      </td>
    </tr>
  );
}

export type SortOrder = "asc" | "desc";

interface SortableTableHeadLinkProps extends ThHTMLAttributes<HTMLTableCellElement> {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: SortOrder;
  baseUrl: string;
  searchParams?: Record<string, string>;
  onSort?: never;
}

interface SortableTableHeadButtonProps extends ThHTMLAttributes<HTMLTableCellElement> {
  label: string;
  sortKey: string;
  currentSort?: string;
  currentOrder?: SortOrder;
  onSort: (key: string, order: SortOrder) => void;
  baseUrl?: never;
  searchParams?: never;
}

type SortableTableHeadProps = SortableTableHeadLinkProps | SortableTableHeadButtonProps;

export function SortableTableHead({
  label,
  sortKey,
  currentSort,
  currentOrder,
  baseUrl,
  searchParams,
  onSort,
  className = "",
  ...props
}: SortableTableHeadProps) {
  const isActive = currentSort === sortKey;
  const nextOrder: SortOrder = isActive && currentOrder === "asc" ? "desc" : "asc";

  const icon = isActive
    ? currentOrder === "asc"
      ? <SortAscIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
      : <SortDescIcon className="w-3 h-3 text-da-blue-900 dark:text-da-blue-300" />
    : <SortIcon className="w-3 h-3 text-slate-400" />;

  const activeStyle = isActive ? "text-slate-900 dark:text-white" : "";

  if (onSort) {
    return (
      <th
        className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className}`}
        {...props}
      >
        <button type="button" onClick={() => onSort(sortKey, nextOrder)} className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ${activeStyle}`}>
          {label}
          {icon}
        </button>
      </th>
    );
  }

  // Link-based (server component compatible)
  const params = new URLSearchParams(searchParams || {});
  params.set("sort", sortKey);
  params.set("order", nextOrder);
  params.delete("page"); // Reset page on sort change

  return (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider ${className}`}
      {...props}
    >
      <Link href={`${baseUrl}?${params.toString()}`} className={`inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors ${activeStyle}`}>
        {label}
        {icon}
      </Link>
    </th>
  );
}
