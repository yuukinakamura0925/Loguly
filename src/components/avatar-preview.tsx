"use client";

import { useState } from "react";
import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
};

export default function AvatarPreview({ src, alt = "", size = 28, className = "" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={`rounded-full object-cover flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-da-blue-900/50 transition-all ${className}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      />

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative animate-card-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={src}
              alt={alt}
              width={240}
              height={240}
              className="w-60 h-60 rounded-2xl object-cover shadow-2xl"
            />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
