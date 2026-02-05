# Loguly - 動画視聴ログ管理システム

## プロジェクト概要
eラーニング動画のスキップ防止・視聴ログ管理システム（B2B SaaS）。組織単位で動画ライセンスを販売し、研修動画を確実に視聴させることが目的。

## 技術スタック
- **フレームワーク**: Next.js 16 (App Router) + React 19 + TypeScript
- **スタイリング**: Tailwind CSS 4
- **バックエンド/DB**: Supabase (PostgreSQL, Auth, RLS)
- **動画配信**: Cloudflare Stream
- **ホスティング**: Vercel
- **パスエイリアス**: `@/*` → `./src/*`

## コマンド
- `npm run dev` - 開発サーバー起動
- `npm run build` - プロダクションビルド
- `npm run lint` - ESLint実行

## ディレクトリ構成
```
src/
├── app/
│   ├── page.tsx              # ランディングページ
│   ├── login/                # ログイン
│   ├── admin/                # プラットフォーム管理画面
│   │   ├── layout.tsx        # サイドバー付きレイアウト
│   │   ├── organizations/    # 組織CRUD
│   │   ├── categories/       # カテゴリCRUD
│   │   ├── videos/           # 動画CRUD
│   │   └── licenses/         # ライセンス割当
│   ├── org/                  # 組織管理者画面
│   │   ├── layout.tsx        # サイドバー付きレイアウト
│   │   ├── members/          # メンバー管理・招待
│   │   ├── progress/         # 視聴進捗マトリクス
│   │   └── settings/         # 組織設定
│   ├── invite/[token]/       # 招待受諾・サインアップ
│   ├── dashboard/            # 動画一覧（組織スコープ）
│   └── watch/[id]/           # 動画プレイヤー（スキップ制限+視聴人数制限）
├── components/               # admin-sidebar, org-sidebar
├── lib/
│   ├── supabase/             # client.ts, server.ts, middleware.ts
│   └── auth.ts               # getCurrentProfile, getCurrentOrg, requireRole
├── types/database.ts         # 全テーブルの型定義
└── middleware.ts              # 認証+ロールベースルーティング
supabase/migrations/
├── 001_initial_schema.sql    # 初期スキーマ
└── 002_multi_tenant.sql      # 組織・ライセンス・招待
```

## ロール構成
- `platform_admin`: プラットフォーム管理者 → /admin/*
- `org_admin`: 組織管理者 → /org/*（メンバー招待可能）
- `member`: 視聴者 → /dashboard, /watch

## データベース (Supabase)
### テーブル
- **profiles**: ユーザー情報 (role: 'platform_admin' | 'org_admin' | 'member')
- **organizations**: 組織 (name, slug, is_active)
- **organization_members**: 組織メンバー (organization_id, user_id, role)
- **organization_licenses**: 動画ライセンス (organization_id, video_id, max_viewers, expires_at)
- **invitations**: 招待 (organization_id, email, token, expires_at)
- **categories**: 動画カテゴリ
- **videos**: 動画メタデータ (cf_video_id, duration, is_published)
- **view_logs**: 視聴ログ (max_watched_seconds, completed) - UNIQUE(user_id, video_id)

### RLSヘルパー関数
- `auth_role()` - 現在ユーザーのrole
- `auth_org_id()` - 現在ユーザーの組織ID

### RLS方針
- platform_admin: 全テーブル全操作
- org_admin/member: 自組織のデータのみ。動画はライセンスのあるもののみ表示

## コーディング規約
- Server Components をデフォルトで使用。クライアント操作が必要な場合のみ `'use client'`
- Supabase クライアント: サーバー側は `server.ts`、ブラウザ側は `client.ts` を使い分ける
- 認証チェック: `requireRole()` をサーバーコンポーネントで使用
- Server Actions: 各ルートの `actions.ts` に配置、先頭で `requireRole()` を呼ぶ
- 日本語UIテキスト
- コミットメッセージは英語 (conventional commits: feat/fix/docs/refactor)

## 環境変数
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase プロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 公開キー
- `NEXT_PUBLIC_APP_URL` - アプリURL（招待リンク生成用）
- `RESEND_API_KEY` - メール送信用（未設定、TODO）
