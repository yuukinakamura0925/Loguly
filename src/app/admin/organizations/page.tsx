import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listOrganizations } from "@/lib/db";
import { deleteOrganization } from "./actions";
import {
  Button,
  Badge,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "@/components/icons";

export default async function OrganizationsPage() {
  const supabase = await createClient();

  const { data: organizations } = await listOrganizations(supabase);

  return (
    <div>
      <PageHeader
        title="組織管理"
        description="登録されている組織を管理します"
        action={
          <Link href="/admin/organizations/new">
            <Button>
              <PlusIcon />
              組織を作成
            </Button>
          </Link>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>組織名</TableHead>
            <TableHead>メンバー数</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="text-right w-32">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {organizations?.map((org) => {
            const memberCount = (org.organization_members as { count: number }[])?.[0]?.count ?? 0;

            return (
              <TableRow key={org.id}>
                <TableCell className="text-slate-900 dark:text-white font-medium">
                  {org.name}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <UsersIcon className="w-4 h-4" />
                    {memberCount}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={org.is_active ? "success" : "danger"}>
                    {org.is_active ? "有効" : "無効"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      title="編集"
                    >
                      <PencilIcon />
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteOrganization(org.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="削除"
                      >
                        <TrashIcon />
                      </button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {(!organizations || organizations.length === 0) && (
            <TableEmpty colSpan={4} message="組織がまだ登録されていません" />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
