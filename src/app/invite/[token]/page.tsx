import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvitationByToken } from "@/lib/db";
import SignupForm from "./signup-form";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: invitation } = await getInvitationByToken(supabase, token);

  if (!invitation) {
    notFound();
  }

  const orgName = (invitation.organizations as unknown as { name: string })
    ?.name;

  const isExpired = new Date(invitation.expires_at) < new Date();
  const isAccepted = !!invitation.accepted_at;

  if (isExpired || isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Loguly
              </h1>
            </div>

            <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-300 font-medium mb-1">
                {isAccepted ? "この招待は既に使用されています" : "この招待リンクは有効期限が切れています"}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {isAccepted
                  ? "この招待は既に受諾済みです。ログインページからログインしてください。"
                  : "組織の管理者に再度招待を依頼してください。"}
              </p>
            </div>

            <a
              href="/login"
              className="block w-full text-center px-4 py-2 bg-da-blue-600 hover:bg-da-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ログインページへ
            </a>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="mb-6 p-4 bg-da-blue-50 dark:bg-da-blue-900/20 border border-da-blue-200 dark:border-da-blue-900 rounded-lg">
            <p className="text-sm text-da-blue-900 dark:text-da-blue-300">
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
