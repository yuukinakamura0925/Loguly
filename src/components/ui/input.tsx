"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, id, type, ...props }, ref) => {
    const isPassword = type === "password";
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-bold text-da-gray-800 dark:text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isPassword && showPassword ? "text" : type}
            className={`
              w-full px-4 py-3 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border rounded-lg text-da-gray-800 dark:text-white placeholder-da-gray-300 dark:placeholder-slate-500
              hover:border-black focus:ring-2 focus:ring-da-blue-900/20 dark:focus:ring-da-blue-300/20 transition-all
              ${error ? "border-da-error" : "border-da-gray-600 dark:border-slate-600"}
              ${isPassword ? "pr-11" : ""}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-sm text-da-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
