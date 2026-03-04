import { type HTMLAttributes } from "react";

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success";
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function Progress({
  value,
  max = 100,
  size = "md",
  variant = "default",
  className = "",
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const isComplete = percentage === 100;

  return (
    <div
      className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]} ${className}`}
      {...props}
    >
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          variant === "success" || isComplete
            ? "bg-da-success"
            : "bg-da-blue-900"
        }`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
