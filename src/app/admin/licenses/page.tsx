"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listLicensesWithDetails, listOrganizationNames, listVideoNames } from "@/lib/db";
import { assignLicense, revokeLicense } from "./actions";
import {
  Button,
  Input,
  Select,
  Card,
  CardContent,
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
import { PlusIcon, TrashIcon } from "@/components/icons";

type License = {
  id: string;
  organization_id: string;
  video_id: number;
  expires_at: string | null;
  is_active: boolean;
  organizations: { name: string };
  videos: { title: string };
};

type Org = { id: string; name: string };
type Video = { id: number; title: string };

export default function LicensesPage() {
  const supabase = createClient();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [{ data: lics }, { data: os }, { data: vs }] = await Promise.all([
      listLicensesWithDetails(supabase),
      listOrganizationNames(supabase),
      listVideoNames(supabase),
    ]);
    setLicenses((lics as License[]) || []);
    setOrgs((os as Org[]) || []);
    setVideos((vs as Video[]) || []);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(formData: FormData) {
    setError("");
    const result = await assignLicense(formData);
    if (result.error) {
      setError(result.error);
    } else {
      setShowForm(false);
      load();
    }
  }

  async function handleRevoke(id: string) {
    setError("");
    const result = await revokeLicense(id);
    if (result.error) {
      setError(result.error);
    } else {
      load();
    }
  }

  return (
    <div>
      <PageHeader
        title="ライセンス管理"
        description="組織への動画ライセンス割り当てを管理します"
        action={
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? "secondary" : "primary"}
          >
            {showForm ? (
              "キャンセル"
            ) : (
              <>
                <PlusIcon />
                ライセンスを割当
              </>
            )}
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-red-800 bg-red-900/20">
          <CardContent className="py-3">
            <p className="text-sm text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6">
          <CardContent>
            <form action={handleAssign} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Select name="organization_id" label="組織" required>
                  <option value="">選択してください</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </Select>
                <Select name="video_id" label="動画" required>
                  <option value="">選択してください</option>
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.title}
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                name="expires_at"
                label="有効期限（任意）"
                type="date"
              />
              <div className="pt-2">
                <Button type="submit">割当</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>組織</TableHead>
            <TableHead>動画</TableHead>
            <TableHead>有効期限</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="text-right w-24">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {licenses.map((lic) => (
            <TableRow key={lic.id}>
              <TableCell className="text-white font-medium">
                {lic.organizations?.name}
              </TableCell>
              <TableCell className="text-slate-300">
                {lic.videos?.title}
              </TableCell>
              <TableCell className="text-slate-400 text-sm">
                {lic.expires_at
                  ? new Date(lic.expires_at).toLocaleDateString("ja-JP")
                  : "なし"}
              </TableCell>
              <TableCell>
                <Badge variant={lic.is_active ? "success" : "danger"}>
                  {lic.is_active ? "有効" : "無効"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <button
                  onClick={() => handleRevoke(lic.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="削除"
                >
                  <TrashIcon />
                </button>
              </TableCell>
            </TableRow>
          ))}
          {licenses.length === 0 && (
            <TableEmpty colSpan={5} message="ライセンスがまだ割り当てられていません" />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
