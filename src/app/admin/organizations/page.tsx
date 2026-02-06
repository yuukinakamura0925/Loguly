import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listOrganizations } from "@/lib/db";
import { deleteOrganization } from "./actions";

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const { data: organizations } = await listOrganizations(supabase);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">組織管理</h1>
        <Link
          href="/admin/organizations/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          組織を作成
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                組織名
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                スラッグ
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                メンバー数
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-400">
                ステータス
              </th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-400">
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {organizations?.map((org) => (
              <tr
                key={org.id}
                className="border-b border-gray-700 last:border-b-0"
              >
                <td className="px-4 py-3 text-white">{org.name}</td>
                <td className="px-4 py-3 text-gray-400 font-mono text-sm">
                  {org.slug}
                </td>
                <td className="px-4 py-3 text-gray-400">
                  {(org.organization_members as { count: number }[])?.[0]
                    ?.count ?? 0}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      org.is_active
                        ? "bg-green-900 text-green-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {org.is_active ? "有効" : "無効"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/organizations/${org.id}`}
                    className="text-blue-400 hover:text-blue-300 text-sm mr-3"
                  >
                    編集
                  </Link>
                  <form
                    action={async () => {
                      "use server";
                      await deleteOrganization(org.id);
                    }}
                    className="inline"
                  >
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      削除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!organizations || organizations.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  組織がまだ登録されていません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
