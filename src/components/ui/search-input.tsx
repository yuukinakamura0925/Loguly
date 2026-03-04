"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

type SearchInputProps = {
  placeholder?: string;
  paramName?: string;
  className?: string;
};

export function SearchInput({
  placeholder = "検索...",
  paramName = "q",
  className = "",
}: SearchInputProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get(paramName) || "");

  useEffect(() => {
    setValue(searchParams.get(paramName) || "");
  }, [searchParams, paramName]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    setValue(newValue);

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (newValue) {
        params.set(paramName, newValue);
      } else {
        params.delete(paramName);
      }
      // Reset page when searching
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className={`relative ${className}`}>
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-700 rounded-lg text-da-gray-800 dark:text-white placeholder-da-gray-300 hover:border-black transition-all"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}
    </div>
  );
}
