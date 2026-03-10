# Loguly 納品ドキュメント

## 1. システム概要

eラーニング動画のスキップ防止・視聴ログ管理システム（B2B SaaS）。
組織単位で動画を配信し、研修動画の確実な視聴を支援します。

---

## 2. 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) + React 19 + TypeScript |
| スタイリング | Tailwind CSS 4 |
| バックエンド/DB | Supabase (PostgreSQL, Auth, Storage, RLS) |
| 動画配信 | Cloudflare Stream |
| ホスティング | Vercel |
| メール送信 | Gmail SMTP (Nodemailer) |

---

## 3. 機能一覧

### 3.1 プラットフォーム管理者 (platform_admin)
- 組織の作成・編集・削除
- カテゴリの作成・編集・削除・並び替え
- 動画の登録・編集・削除・並び替え（Cloudflare Stream連携）
- 組織への動画ライセンス割当（視聴人数上限・有効期限）
- 組織メンバーの追加・削除

### 3.2 組織管理者 (org_admin)
- メンバーの招待（招待リンク生成・メール送信）
- メンバーの削除
- 動画プレビュー・ラベル設定（「必須」「推奨」など）
- 動画・カテゴリの表示順カスタマイズ
- メンバー全員の視聴進捗の一覧確認
- 組織名の変更
- 初回ログイン時のオンボーディングツアー

### 3.3 メンバー (member)
- 割り当て済み動画の視聴（スキップ防止機能付き）
- 学習進捗の確認（全体・カテゴリ別）
- アカウント設定（表示名・アバター・パスワード変更）
- 初回ログイン時のオンボーディングツアー

### 3.4 共通機能
- メールアドレス + パスワード認証
- パスワードリセット
- ダークモード切り替え
- レスポンシブ対応（モバイル・タブレット・デスクトップ）

---

## 4. セキュリティ対策

### 4.1 認証・認可
- **認証**: Supabase Auth（メール+パスワード）
- **ミドルウェア**: 全保護ルートでロールベースのアクセス制御
- **Server Actions**: 全関数の先頭で`requireRole()`による認証チェック
- **RLS（行レベルセキュリティ）**: 全9テーブルに有効、ロール別アクセスポリシー設定済み

### 4.2 データ保護
- **SQLインジェクション対策**: Supabaseクライアントのパラメータ化クエリを全面使用（生SQL不使用）
- **XSS対策**: Reactの自動エスケープ、`dangerouslySetInnerHTML`不使用
- **オープンリダイレクト対策**: Auth callbackのリダイレクト先を内部パスのみに制限
- **CSRF対策**: Next.jsのServer Actionsによる自動保護

### 4.3 ファイルアップロード
- 画像サイズ制限（10MB）
- MIMEタイプ検証
- Sharp によるリエンコード（悪意あるファイル形式を無効化）
- ユーザーIDベースのストレージパス（クロスユーザーアクセス防止）

### 4.4 環境変数
- シークレットキーはサーバーサイドのみ（`NEXT_PUBLIC_`プレフィックスなし）
- `.env.local`は`.gitignore`に登録済み
- 本番環境ではVercel環境変数で管理

### 4.5 RLSポリシー一覧

| テーブル | RLS | ポリシー数 | 備考 |
|---------|-----|-----------|------|
| profiles | 有効 | 4 | 自分のプロフィールのみ更新可 |
| categories | 有効 | 2 | 全認証ユーザー閲覧可、管理はplatform_adminのみ |
| videos | 有効 | 2 | ライセンスのある動画のみ閲覧可 |
| view_logs | 有効 | 5 | 自分のログのみCRUD可 |
| organizations | 有効 | 3 | 自組織のみ閲覧・更新可 |
| organization_members | 有効 | 5 | org_adminが自組織メンバーを管理可 |
| organization_licenses | 有効 | 3 | 自組織のライセンスのみ閲覧可 |
| org_category_order | 有効 | 3 | org_adminが自組織の表示順を管理可 |
| invitations | 有効 | 2 | org_adminが自組織の招待を管理可 |

---

## 5. インフラ構成

```
ユーザー → Vercel (Next.js) → Supabase (PostgreSQL + Auth + Storage)
                             → Cloudflare Stream (動画配信)
                             → Gmail SMTP (メール送信)
```

### 月額運用コスト（目安）
| サービス | プラン | 月額 |
|---------|--------|------|
| Vercel | Hobby (無料) / Pro ($20) | $0〜$20 |
| Supabase | Free / Pro ($25) | $0〜$25 |
| Cloudflare Stream | 従量課金 | ストレージ$5/1000分 + 配信$1/1000分 |
| Gmail SMTP | 無料（月500通上限） | $0 |

---

## 6. 既知の制限事項

1. **メール送信**: Gmail SMTP使用、月500通上限。大規模運用時はSendGrid等への切り替えを推奨
2. **動画配信**: Cloudflare Streamの従量課金。動画数・視聴者数に応じてコスト増加
3. **同時視聴制限**: ライセンスの`max_viewers`による制御はサーバーサイドチェック（リアルタイム制御ではない）
4. **スキップ防止**: クライアントサイド制御 + サーバーサイド進捗記録。ブラウザの開発者ツールでの回避は技術的に可能だが、サーバーに記録される進捗は正確
5. **ブラウザ対応**: モダンブラウザ（Chrome, Firefox, Safari, Edge の最新版）をサポート
6. **多言語対応**: 日本語のみ

---

## 7. 環境変数一覧

| 変数名 | 用途 | 公開範囲 |
|--------|------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | クライアント |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー | クライアント |
| `NEXT_PUBLIC_APP_URL` | アプリURL（招待リンク生成用） | クライアント |
| `NEXT_PUBLIC_VIDEO_BASE_URL` | 動画CDNベースURL | クライアント |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase管理キー | サーバーのみ |
| `DATABASE_URL` | DB接続文字列 | サーバーのみ |
| `R2_ACCOUNT_ID` | Cloudflare R2 アカウントID | サーバーのみ |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 アクセスキー | サーバーのみ |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 シークレットキー | サーバーのみ |
| `R2_BUCKET_NAME` | Cloudflare R2 バケット名 | サーバーのみ |
| `GMAIL_USER` | メール送信元Gmail | サーバーのみ |
| `GMAIL_APP_PASSWORD` | Gmailアプリパスワード | サーバーのみ |

---

## 8. 納品物

- ソースコード一式（GitHubリポジトリ）
- データベースマイグレーションファイル
- 本ドキュメント

---

## 9. 免責事項

- 本システムは現状有姿（as-is）での納品となります
- 納品後の保守・運用サポートは別途契約が必要です
- 第三者サービス（Supabase, Vercel, Cloudflare, Gmail）の仕様変更・障害については保証対象外です
- セキュリティ対策は納品時点でのベストプラクティスに基づいていますが、将来的な脆弱性の発見については保証対象外です
