import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Loguly",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-da-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">プライバシーポリシー</h1>
        <p className="text-slate-400 text-sm mb-12">施行日: 2026年3月6日</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">はじめに</h2>
            <p>
              株式会社プロウイング（以下「当社」）は、動画視聴管理サービス「Loguly」（以下「本サービス」）におけるユーザーの個人情報の保護に努めています。
              本プライバシーポリシーは、本サービスの全ユーザーに適用され、個人情報の取り扱いについて定めるものです。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. 収集する情報</h2>
            <p className="mb-3">本サービスでは、以下の情報を収集します。</p>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">アカウント情報</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>メールアドレス</li>
              <li>表示名</li>
              <li>パスワード（ハッシュ化して保存）</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">組織情報</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>所属組織名</li>
              <li>組織内の役割（組織管理者またはメンバー）</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">視聴ログ</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>視聴した動画のID</li>
              <li>最大視聴秒数</li>
              <li>視聴完了状態</li>
              <li>視聴日時</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4 mb-2">技術データ</h3>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>IPアドレス</li>
              <li>ブラウザの種類</li>
              <li>デバイス情報</li>
              <li>アクセス日時</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. 利用目的</h2>
            <p className="mb-3">収集した情報は、以下の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>本サービスの提供および維持</li>
              <li>ユーザー認証およびアクセス制御</li>
              <li>動画の視聴進捗の記録および管理（本サービスの中核機能）</li>
              <li>組織管理者向けの視聴状況レポートの生成</li>
              <li>サービスの改善およびトラブルシューティング</li>
              <li>お問い合わせへの対応</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. 第三者提供</h2>
            <p className="mb-3">
              本サービスの運営にあたり、以下の第三者サービスプロバイダーにデータを提供しています。
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><span className="text-white font-medium">Supabase (Singapore Pte. Ltd.)</span> — データベースホスティング、ユーザー認証</li>
              <li><span className="text-white font-medium">Cloudflare, Inc.</span> — 動画配信（Cloudflare Stream）、CDN</li>
              <li><span className="text-white font-medium">Vercel Inc.</span> — アプリケーションホスティング</li>
            </ul>
            <p className="mt-3">
              個人情報を第三者に販売することはありません。
              法令に基づく場合、または裁判所の命令がある場合には、情報を開示することがあります。
            </p>
            <p className="mt-3">
              なお、組織管理者は所属メンバーの視聴進捗を閲覧できます。これは本サービスの中核機能であり、
              メンバーは本サービスの利用にあたり、この点に同意するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. データの保管</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>アカウント情報: アカウントが有効な間保管し、削除リクエストまたはアカウント停止時に削除します。</li>
              <li>視聴ログ: 組織との契約期間中保管します。</li>
              <li>技術ログ: 最大12ヶ月間保管します。</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. ユーザーの権利</h2>
            <p className="mb-3">ユーザーは、以下の権利を有します。</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>自己の個人情報へのアクセスを求める権利</li>
              <li>不正確な情報の訂正を求める権利</li>
              <li>個人情報の削除を求める権利（契約上の義務がある場合を除く）</li>
              <li>同意の撤回を求める権利</li>
            </ul>
            <p className="mt-3">
              これらの権利の行使については、ご所属の組織管理者または当社までご連絡ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Cookieについて</h2>
            <p>
              本サービスでは、認証セッション管理のために必要最低限のCookieを使用しています。
              トラッキング目的や広告目的のCookieは一切使用しません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. セキュリティ</h2>
            <p>当社は、以下の技術的措置により個人情報の保護に努めています。</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-3">
              <li>TLS/SSL による通信の暗号化</li>
              <li>Row Level Security (RLS) によるデータベースレベルのアクセス制御</li>
              <li>パスワードのハッシュ化保存</li>
              <li>ロールベースのアクセス制御</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. お子様のプライバシー</h2>
            <p>
              本サービスは16歳未満の方を対象としておらず、16歳未満の方から意図的に個人情報を収集することはありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. プライバシーポリシーの変更</h2>
            <p>
              当社は、必要に応じて本プライバシーポリシーを変更することがあります。
              変更後のポリシーは本ページに掲載した時点で効力を生じます。
              重要な変更がある場合には、本サービス上で通知いたします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. お問い合わせ</h2>
            <p className="mb-3">個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください。</p>
            <div className="space-y-2 ml-2">
              <p><span className="text-white font-medium">株式会社プロウイング</span></p>
              <p>〒101-0045 東京都千代田区神田鍛冶町3-5-8 KDX神田北口ビル2F</p>
              <p>TEL: 03-3254-7711</p>
              <p>FAX: 03-3254-7712</p>
              <p>URL: <a href="https://www.pro-wing.co.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">https://www.pro-wing.co.jp/</a></p>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col items-center gap-4 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300 transition-colors">
            利用規約
          </Link>
          <Link href="/" className="hover:text-slate-300 transition-colors">
            &larr; トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
