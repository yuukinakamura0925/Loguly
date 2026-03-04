import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-bold text-da-gray-800 dark:text-slate-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-4 py-3 bg-white dark:bg-slate-900/50 border rounded-lg text-da-gray-800 dark:text-white placeholder-da-gray-300 dark:placeholder-slate-500
            hover:border-black transition-all
            ${error ? "border-da-error" : "border-da-gray-600 dark:border-slate-600"}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="text-sm text-da-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
