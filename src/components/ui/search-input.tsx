"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchIcon, LoaderIcon } from "@/components/icons";

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
  const paramValue = searchParams.get(paramName) || "";
  const [value, setValue] = useState(paramValue);

  if (value !== paramValue && !isPending) {
    setValue(paramValue);
  }

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
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-da-gray-600 dark:border-slate-700 rounded-lg text-da-gray-800 dark:text-white placeholder-da-gray-300 hover:border-black transition-all"
      />
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <LoaderIcon className="animate-spin w-4 h-4 text-slate-400" />
        </div>
      )}
    </div>
  );
}
