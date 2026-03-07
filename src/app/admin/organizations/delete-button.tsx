"use client";

import { useFormStatus } from "react-dom";
import { TrashIcon } from "@/components/icons";

function DeleteButtonInner() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`p-1.5 rounded-lg transition-all ${
        pending
          ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
          : "text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
      }`}
      title="削除"
      onClick={(e) => {
        if (!confirm("この組織を削除してもよろしいですか？")) {
          e.preventDefault();
        }
      }}
    >
      {pending ? (
        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <TrashIcon />
      )}
    </button>
  );
}

export default function DeleteButton() {
  return <DeleteButtonInner />;
}
