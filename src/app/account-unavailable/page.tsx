import LogoutButton from "@/app/dashboard/logout-button";

export default function AccountUnavailablePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">アカウント情報を確認できませんでした</h1>
        <p>
          プロフィールまたは所属組織の情報を取得できませんでした。
          時間をおいて再度お試しください。解消しない場合は、管理者にアカウントと所属組織の確認をご依頼ください。
        </p>
        <a href="/dashboard" className="block underline">再試行する</a>
        <LogoutButton />
      </div>
    </main>
  );
}
