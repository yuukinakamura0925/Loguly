import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getValidInvitationByToken } from "@/lib/db";
import SignupForm from "./signup-form";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invitation } = await getValidInvitationByToken(supabase, token);

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
