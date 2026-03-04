import { forwardRef, type SelectHTMLAttributes, type ReactNode } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, id, children, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-bold text-da-gray-800 dark:text-slate-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3 bg-white dark:bg-slate-900/50 border rounded-lg text-da-gray-800 dark:text-white
            hover:border-black transition-all
            ${error ? "border-da-error" : "border-da-gray-600 dark:border-slate-600"}
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-sm text-da-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
