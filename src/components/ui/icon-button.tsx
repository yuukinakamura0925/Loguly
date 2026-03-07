import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type IconButtonVariant = "ghost" | "danger";
type IconButtonSize = "sm" | "md";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon: ReactNode;
  label: string;
}

const variantStyles: Record<IconButtonVariant, string> = {
  ghost: "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.92] active:bg-slate-300 dark:active:bg-slate-600",
  danger: "text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-[0.92] active:bg-red-200 dark:active:bg-red-900/40",
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: "p-1.5 rounded-lg",
  md: "p-2 rounded-xl",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "sm", icon, label, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        title={label}
        aria-label={label}
        className={`
          transition-all
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
