import { type HTMLAttributes, type ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-da-gray-50 text-da-gray-800 dark:bg-slate-800 dark:text-slate-400",
  success: "bg-emerald-100 text-da-success dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-da-error dark:bg-red-900/30 dark:text-red-400",
  info: "bg-da-blue-50 text-da-blue-900 dark:bg-blue-900/30 dark:text-blue-400",
};

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
}
