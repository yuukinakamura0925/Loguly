import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, type ReactNode } from "react";

interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

export function Table({ className = "", children, ...props }: TableProps) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
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
    <thead className={`bg-slate-800/50 ${className}`} {...props}>
      {children}
    </thead>
  );
}

interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
  children: ReactNode;
}

export function TableBody({ className = "", children, ...props }: TableBodyProps) {
  return (
    <tbody className={`divide-y divide-slate-800 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  children: ReactNode;
}

export function TableRow({ className = "", children, ...props }: TableRowProps) {
  return (
    <tr className={`hover:bg-slate-800/30 transition-colors ${className}`} {...props}>
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
      className={`px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${className}`}
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
    <td className={`px-4 py-4 text-slate-300 ${className}`} {...props}>
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
