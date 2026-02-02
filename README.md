# Loguly

動画視聴ログ管理システム - スキップ不可の動画プレイヤーで確実な視聴完了を保証

## 概要

Logulyは、研修動画やeラーニングコンテンツの視聴を「確実に完了させる」ための動画視聴ログ管理システムです。

### 主な特長

- **スキップ制限** - 初回視聴時は未視聴区間への早送りを禁止
- **秒単位のログ記録** - 5秒ごとのHeartbeat通信で視聴位置を正確に記録
- **自動再開** - 途中離脱しても次回アクセス時に続きから再生
- **リアルタイム進捗管理** - 管理者は全ユーザーの視聴状況を把握可能

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14+ (App Router), Tailwind CSS |
| バックエンド/DB | Supabase (Auth, Database, Realtime) |
| 動画配信 | Cloudflare Stream |
| ホスティング | Vercel |

## 機能一覧

### ユーザー機能

- ログイン/ログアウト
- カテゴリ別動画一覧表示
- スキップ制限付き動画プレイヤー
- 視聴進捗の確認

### 管理者機能

- 動画のアップロード・管理
- カテゴリ管理
- ユーザーアカウント管理
- 視聴ログの閲覧・CSVエクスポート

## セットアップ

### 必要条件

- Node.js 18+
- npm or pnpm
- Supabaseアカウント
- Cloudflareアカウント（Stream有効化済み）

### 環境変数

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
```

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

## プロジェクト構成

```
loguly/
├── docs/               # ドキュメント
│   ├── requirements.md # 要件定義書
│   └── proposal.md     # 提案書
├── src/
│   ├── app/            # Next.js App Router
│   ├── components/     # Reactコンポーネント
│   ├── lib/            # ユーティリティ
│   └── types/          # TypeScript型定義
├── supabase/
│   └── migrations/     # DBマイグレーション
└── public/             # 静的ファイル
```

## ドキュメント

- [要件定義書](./docs/requirements.md)
- [提案書](./docs/proposal.md)

## ライセンス

Private
