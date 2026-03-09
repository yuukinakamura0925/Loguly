"use client";

import { useState, useRef } from "react";
import { useFormStatus } from "react-dom";
import { TrashIcon } from "@/components/icons";
import { ConfirmModal } from "@/components/ui";

function DeleteButtonInner() {
  const { pending } = useFormStatus();
  const [showConfirm, setShowConfirm] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        ref={buttonRef}
        className={`p-1.5 rounded-lg transition-all ${
          pending
            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
            : "text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20"
        }`}
        title="削除"
        onClick={() => setShowConfirm(true)}
      >
        {pending ? (
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <TrashIcon />
        )}
      </button>
      <ConfirmModal
        open={showConfirm}
        title="組織を削除"
        message="この組織を削除してもよろしいですか？"
        onConfirm={() => {
          setShowConfirm(false);
          buttonRef.current?.closest("form")?.requestSubmit();
        }}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}

export default function DeleteButton() {
  return <DeleteButtonInner />;
}
