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
  ghost: "text-slate-400 hover:text-white hover:bg-slate-700",
  danger: "text-slate-400 hover:text-red-400 hover:bg-red-500/10",
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
