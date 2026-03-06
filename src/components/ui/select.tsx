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
            w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border rounded-lg text-da-gray-800 dark:text-white
            hover:border-black focus:ring-2 focus:ring-da-blue-900/20 dark:focus:ring-da-blue-300/20 transition-all
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
