import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約 | Loguly",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-da-gray-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">利用規約</h1>
        <p className="text-slate-400 text-sm mb-12">施行日: 2026年3月6日</p>

        <div className="space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">第1条（総則）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本利用規約（以下「本規約」）は、株式会社プロウイング（以下「当社」）が提供する動画視聴管理サービス「Loguly」（以下「本サービス」）の利用条件を定めるものです。</li>
              <li>ユーザーは、本規約に同意の上、本サービスを利用するものとします。</li>
              <li>本サービスを利用した時点で、ユーザーは本規約に同意したものとみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第2条（定義）</h2>
            <p className="mb-3">本規約において、以下の用語は次の意味で使用します。</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>「ユーザー」とは、本サービスを利用するすべての個人をいいます。</li>
              <li>「組織」とは、本サービスのライセンスを購入し、所属メンバーに動画視聴を提供する法人または団体をいいます。</li>
              <li>「コンテンツ」とは、本サービスを通じて配信される動画およびその関連資料をいいます。</li>
              <li>「組織管理者」とは、組織においてメンバーの管理権限を有するユーザーをいいます。</li>
              <li>「メンバー」とは、組織に所属し、動画を視聴するユーザーをいいます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第3条（アカウント登録）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本サービスへの登録は、組織管理者からの招待によってのみ行うことができます。</li>
              <li>ユーザーは、登録にあたり正確な情報を提供しなければなりません。</li>
              <li>ユーザーは、自己のログイン情報を適切に管理する責任を負い、第三者に開示、貸与または共有してはなりません。</li>
              <li>ログイン情報の管理不十分、第三者の使用等による損害について、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第4条（サービス内容）</h2>
            <p className="mb-3">本サービスは、以下の機能を提供します。</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>スキップ制限付き動画配信機能</li>
              <li>視聴ログの記録および進捗管理機能</li>
              <li>組織単位でのライセンス管理機能</li>
              <li>組織管理者向けの視聴状況レポート機能</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第5条（禁止事項）</h2>
            <p className="mb-3">ユーザーは、以下の行為を行ってはなりません。</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>不正アクセスまたはスキップ制限を回避する行為</li>
              <li>ログイン情報を第三者に開示、貸与または共有する行為</li>
              <li>コンテンツのダウンロード、複製、再配布またはスクリーンキャプチャ等による記録</li>
              <li>本サービスのリバースエンジニアリング、改変または妨害行為</li>
              <li>法令または公序良俗に違反する目的での利用</li>
              <li>当社または第三者の権利を侵害する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第6条（知的財産権）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本サービスおよびコンテンツに関する著作権、商標権その他一切の知的財産権は、当社またはコンテンツ提供者に帰属します。</li>
              <li>ユーザーに付与されるのは、本サービスの利用期間中における限定的かつ非独占的な視聴ライセンスのみであり、その他の権利は一切付与されません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第7条（サービスの中断・変更）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、以下の場合に本サービスの全部または一部を中断・変更することがあります。
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>システムの保守・点検を行う場合</li>
                  <li>天災、停電その他の不可抗力が発生した場合</li>
                  <li>その他、当社がやむを得ないと判断した場合</li>
                </ul>
              </li>
              <li>前項に基づくサービスの中断・変更により生じた損害について、当社は一切の責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第8条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本サービスは現状のまま提供されるものであり、当社は特定目的への適合性について保証しません。</li>
              <li>当社は、本サービスの利用に起因してユーザーに生じた損害について、当社の故意または重大な過失による場合を除き、一切の責任を負いません。</li>
              <li>当社が責任を負う場合であっても、その賠償額は当該ユーザーの属する組織が当社に支払った直近1年間の利用料金の総額を上限とします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第9条（アカウントの停止・削除）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、ユーザーが本規約に違反した場合、事前の通知なくアカウントを停止または削除することができます。</li>
              <li>組織管理者は、所属メンバーのアカウントをいつでも削除することができます。</li>
              <li>組織との契約終了時、当該組織に属するすべてのアカウントは無効化されます。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第10条（利用規約の変更）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>当社は、必要に応じて本規約を変更することがあります。</li>
              <li>変更後の規約は、本ページに掲載した時点で効力を生じるものとします。</li>
              <li>変更後に本サービスを利用した場合、変更後の規約に同意したものとみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">第11条（準拠法・裁判管轄）</h2>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>本規約は日本法に準拠し、日本法に従って解釈されるものとします。</li>
              <li>本規約に関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">運営会社</h2>
            <div className="space-y-2 ml-2">
              <p><span className="text-white font-medium">商号:</span> 株式会社プロウイング</p>
              <p><span className="text-white font-medium">代表者:</span> 代表取締役社長 鎌田智一</p>
              <p><span className="text-white font-medium">所在地:</span> 〒101-0045 東京都千代田区神田鍛冶町3-5-8 KDX神田北口ビル2F</p>
              <p><span className="text-white font-medium">TEL:</span> 03-3254-7711</p>
              <p><span className="text-white font-medium">FAX:</span> 03-3254-7712</p>
              <p><span className="text-white font-medium">URL:</span> <a href="https://www.pro-wing.co.jp/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline transition-colors">https://www.pro-wing.co.jp/</a></p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col items-center gap-4 text-sm text-slate-500">
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">
            プライバシーポリシー
          </Link>
          <Link href="/" className="hover:text-slate-300 transition-colors">
            &larr; トップに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
