# Cloudflare R2 セットアップ手順

動画アップロード機能で使用する Cloudflare R2 の設定手順。

## 1. Cloudflare アカウント作成

1. https://dash.cloudflare.com にアクセス
2. 「Sign up」→ メールアドレス・パスワードを入力して作成
3. メール認証を完了
4. 初期セットアップの質問は適当に回答してOK（後から変更可能）

## 2. R2 バケット作成

1. 左サイドバー →「Storage & databases」→「overview」
2. 右上「+」→「R2ストレージバケット」
3. バケット名: `loguly-videos`
4. リージョン: Asia Pacific（デフォルトでもOK）
5. 作成

## 3. パブリックアクセス有効化

1. 作成した `loguly-videos` バケットをクリック
2. 「設定」タブ
3. 「Public Development URL」を有効化
4. 表示されるURL（`https://pub-xxx.r2.dev`）をメモ → `R2_PUBLIC_URL` に使用

## 4. API トークン作成

1. R2トップページ →「アカウントの詳細」→「APIトークン」→「管理」
2. 「ユーザーAPIトークン」→「APIトークンを作成する」
3. 設定:
   - トークン名: `loguly-r2`
   - 権限: `R2 Object Read & Write`
   - バケット: 「特定のバケットにのみ適用する」→ `loguly-videos`
   - IPフィルタリング: デフォルト（すべてのアドレス）
   - TTL: デフォルト（無期限）
4. 作成後、以下をメモ:
   - **アクセスキーID** → `R2_ACCESS_KEY_ID`
   - **秘密アクセスキー** → `R2_SECRET_ACCESS_KEY`

## 5. CORS ポリシー設定

1. `loguly-videos` バケット →「設定」タブ
2. 「CORSポリシー」セクションで以下のJSONを設定:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT"
    ],
    "AllowedHeaders": [
      "*"
    ]
  }
]
```

> 本番デプロイ時は `AllowedOrigins` に本番URLも追加すること。

## 6. アカウントID確認

R2トップページの「アカウントの詳細」に表示されている `アカウントID` をメモ → `CLOUDFLARE_ACCOUNT_ID`

## 6. 環境変数設定

`.env.local` に以下を追加:

```env
# Cloudflare R2
VIDEO_STORAGE_PROVIDER=r2
CLOUDFLARE_ACCOUNT_ID=（アカウントID）
R2_BUCKET_NAME=loguly-videos
R2_ACCESS_KEY_ID=（アクセスキーID）
R2_SECRET_ACCESS_KEY=（秘密アクセスキー）
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## 本番移行時（Cloudflare Stream）

本番では R2 → Cloudflare Stream に切り替え。環境変数を変更するだけで切り替わる:

```env
VIDEO_STORAGE_PROVIDER=stream
CLOUDFLARE_API_TOKEN=（Stream用APIトークン）
CLOUDFLARE_STREAM_CUSTOMER_CODE=（Streamダッシュボードで確認）
```

## アカウント引き渡し

Cloudflare はアカウントのメールアドレス・パスワード変更が可能。
納品時にクライアントのメールアドレスに変更してアカウントを引き渡せる。
