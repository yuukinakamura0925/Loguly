import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchOrganizations, countOrganizations } from "@/lib/db";
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
  SearchInput,
  Pagination,
} from "@/components/ui";
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon } from "@/components/icons";

const PER_PAGE = 10;

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q || "";
  const page = parseInt(params.page || "1", 10);

  const supabase = await createClient();

  const [{ data: organizations }, { count }] = await Promise.all([
    searchOrganizations(supabase, { search, page, perPage: PER_PAGE }),
    countOrganizations(supabase, search),
  ]);

  const totalPages = Math.ceil((count ?? 0) / PER_PAGE);

  // Build search params for pagination
  const paginationParams: Record<string, string> = {};
  if (search) paginationParams.q = search;

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

      <div className="mb-6">
        <SearchInput placeholder="組織名で検索..." paramName="q" className="max-w-sm" />
      </div>

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
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-da-error dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all"
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
            <TableEmpty
              colSpan={4}
              message={search ? "検索結果がありません" : "組織がまだ登録されていません"}
            />
          )}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/admin/organizations"
            searchParams={paginationParams}
          />
        </div>
      )}
    </div>
  );
}
