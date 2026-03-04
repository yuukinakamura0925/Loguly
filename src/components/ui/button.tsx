import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-da-blue-900 hover:bg-da-blue-1000 active:bg-da-blue-1200 text-white hover:underline",
  secondary: "bg-white text-da-blue-900 border border-current hover:bg-da-blue-200 hover:text-da-blue-1000 hover:underline dark:bg-slate-800 dark:text-da-blue-300 dark:border-da-blue-300 dark:hover:bg-slate-700",
  ghost: "text-da-blue-900 hover:bg-da-blue-50 hover:underline dark:text-da-blue-300 dark:hover:bg-slate-800",
  danger: "bg-da-error hover:bg-red-800 text-white hover:underline",
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
          disabled:bg-da-gray-300 disabled:text-da-gray-50 disabled:cursor-not-allowed disabled:shadow-none disabled:no-underline
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
