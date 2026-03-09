# 本番移行TODO

## 現在の状況

### Supabase（DB・認証）
- **プラン**: Free（無料）
- **プロジェクト**: mfarwizdlqugygugrrug
- **リージョン**: 東京（ap-northeast-1）
- **DB**: PostgreSQL（RLS有効、マイグレーション適用済み）
- **認証**: メール/パスワード認証
- **制限**: 500MB DB、50,000 MAU、1GB帯域/月
- **アカウント**: 自分名義

### Vercel（ホスティング）
- **プラン**: Hobby（無料）
- **URL**: https://loguly.vercel.app
- **Production Branch**: main
- **自動デプロイ**: mainへのpushで発火
- **リージョン**: 米国西部（Portland）※無料プランは固定
- **制限**: 100GB帯域/月、関数10秒、商用利用NG
- **アカウント**: 自分のGitHub連携

### Cloudflare（動画ストレージ）
- **利用サービス**: R2（S3互換オブジェクトストレージ）
- **バケット**: loguly-videos（Asia Pacific）
- **パブリックURL**: https://pub-abb109a97c5347668f4d0a6aad0a516d.r2.dev
- **CORS**: localhost:3000 のみ許可
- **制限**: 10GB無料、直接MP4配信（ストリーミング最適化なし）
- **アカウント**: bonds20220705@gmail.com

---

## 本番移行チェックリスト

### 必須（リリース前）

- [ ] **Vercel Pro契約**（$20/月）
  - 商用利用にはPro必須
  - 東京リージョン選択可能（速度改善）
  - 関数実行時間60秒に拡大

- [ ] **Supabase Pro契約**（$25/月）
  - 8GB DB、100,000 MAU、250GB帯域
  - 本番用プロジェクトを新規作成（開発とDB分離）
  - 本番用の環境変数をVercelに設定

- [ ] **Cloudflare R2 → Stream移行**
  - `VIDEO_STORAGE_PROVIDER=stream` に変更
  - Stream用APIトークン取得
  - Customer Code取得
  - 既存動画をStreamに再アップロード

- [ ] **カスタムドメイン設定**
  - ドメイン取得（例: loguly.jp）
  - Vercelにカスタムドメイン追加
  - SSL自動設定

- [ ] **CORS設定更新**
  - R2/StreamのCORSに本番ドメインを追加
  - `AllowedOrigins` にカスタムドメインを追加

- [ ] **Supabase認証URL更新**
  - Site URL → 本番ドメインに変更
  - Redirect URLs → 本番ドメイン追加

- [ ] **環境変数更新**
  - `NEXT_PUBLIC_APP_URL` → 本番ドメイン
  - `NEXT_PUBLIC_VIDEO_BASE_URL` → Stream or 本番R2 URL

### 推奨（リリース後早期）

- [ ] **メール送信設定**（Resend）
  - [x] Resendアカウント作成済み
  - [x] `RESEND_API_KEY` 設定済み（開発環境）
  - [x] 招待メール送信機能 実装済み（月100通制限・残数表示付き）
  - [ ] Vercelに `RESEND_API_KEY` 環境変数を追加
  - [ ] Vercelに `RESEND_FROM_ADDRESS` 環境変数を追加（認証済みドメインのアドレス）
  - [ ] Resendでカスタムドメイン認証（DNS: SPF/DKIM設定）
  - [ ] 無料プラン: 月100通。有料プラン($20/月)で月5,000通

- [ ] **エラー監視**（Sentry等）
  - 本番エラーを検知・通知

- [ ] **バックアップ設定**
  - Supabase Pro: 自動バックアップ有効化（デフォルトで7日分）

- [ ] **アクセス解析**
  - Vercel Analytics 有効化（Pro含む）

### 将来的（スケール時）

- [ ] **DB分離**（開発/ステージング/本番）
- [ ] **CDN最適化**（Cloudflare Pages or カスタムCDN）
- [ ] **DB接続プーリング**（Supabase Pooler設定最適化）

---

## 月額コスト見積もり

| 規模 | Vercel | Supabase | 動画配信 | 合計 |
|------|--------|----------|----------|------|
| テスト期間 | ¥0 | ¥0 | ¥0 | **¥0** |
| 100ユーザー | ¥3,000 | ¥3,750 | ¥3,000 | **¥9,750** |
| 300ユーザー | ¥3,000 | ¥3,750 | ¥7,500 | **¥14,250** |
| 1,000ユーザー | ¥3,000 | ¥3,750 | ¥23,250 | **¥30,000** |

---

## アカウント引き渡し手順

全サービスのアカウントをクライアントに移管する場合：

1. **Vercel**: Settings → General → メールアドレス変更
2. **Supabase**: Organization Settings → メンバー追加 → オーナー権限移譲
3. **Cloudflare**: My Profile → Email Address 変更
4. **GitHub**: Settings → Transfer repository → クライアントのアカウントへ
5. **パスワード一覧** + **環境変数一覧** を引き渡し文書として作成
