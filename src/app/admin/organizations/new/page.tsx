"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createOrganization } from "../actions";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { ArrowLeftIcon } from "@/components/icons";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await createOrganization(formData);
    if (result.error) {
      setError(result.error);
    } else {
      router.push("/admin/organizations");
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link
          href="/admin/organizations"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeftIcon />
          組織一覧に戻る
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">組織を作成</h1>
      </div>

      <Card>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <Input
              name="name"
              label="組織名"
              required
              placeholder="株式会社○○"
            />

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-xl">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit">作成</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
