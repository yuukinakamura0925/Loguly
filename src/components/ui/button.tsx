import { forwardRef, type ButtonHTMLAttributes } from "react";
import { LoaderIcon } from "@/components/icons";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-da-blue-900 hover:bg-da-blue-1000 active:bg-da-blue-1200 text-white shadow-sm hover:shadow-md",
  secondary: "bg-white text-da-blue-900 border border-current hover:bg-da-blue-200 hover:text-da-blue-1000 hover:shadow-sm dark:bg-slate-800 dark:text-da-blue-300 dark:border-da-blue-300 dark:hover:bg-slate-700",
  ghost: "text-da-blue-900 hover:bg-da-blue-50 dark:text-da-blue-300 dark:hover:bg-slate-800",
  danger: "bg-da-error hover:bg-red-800 text-white shadow-sm hover:shadow-md",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center justify-center gap-2 font-bold transition-all
          hover:scale-[1.02] active:scale-[0.98]
          disabled:bg-da-gray-300 disabled:text-da-gray-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:scale-100
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <LoaderIcon className="animate-spin h-4 w-4" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
