import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignupForm from "./signup-form";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  // 招待を検証
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*, organizations(name)")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    notFound();
  }

  const orgName = (invitation.organizations as unknown as { name: string })
    ?.name;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Loguly
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              組織への招待
            </p>
          </div>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>{orgName}</strong> から
              {invitation.role === "org_admin" ? "組織管理者" : "メンバー"}
              として招待されています
            </p>
          </div>

          <SignupForm email={invitation.email} token={token} />
        </div>
      </div>
    </div>
  );
}
