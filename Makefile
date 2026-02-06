.PHONY: dev build lint setup db-push db-seed db-reset db-status db-repair db-new-migration db-login db-link

# ========================================
# 開発
# ========================================

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

# ========================================
# 初期セットアップ
# ========================================

setup:
	npm install
	cp -n .env.local.example .env.local || true
	@echo "✓ .env.local を編集して Supabase の設定を入力してください"

# ========================================
# Supabase マイグレーション
# ========================================

db-push:
	npx supabase db push

db-seed:
	node scripts/db-execute.mjs supabase/seed.sql

db-reset:
	node scripts/db-execute.mjs supabase/reset.sql
	npx supabase db push
	node scripts/create-admin.mjs
	node scripts/db-execute.mjs supabase/seed.sql

db-status:
	npx supabase migration list

db-repair:
	@echo "Usage: make db-repair VERSION=20250601000000 STATUS=applied"
	@test -n "$(VERSION)" || (echo "VERSION is required" && exit 1)
	@test -n "$(STATUS)" || (echo "STATUS is required (applied/reverted)" && exit 1)
	npx supabase migration repair $(VERSION) --status $(STATUS)

db-new-migration:
	@test -n "$(NAME)" || (echo "Usage: make db-new-migration NAME=add_something" && exit 1)
	npx supabase migration new $(NAME)

# ========================================
# Supabase 接続
# ========================================

db-login:
	npx supabase login

db-link:
	@test -n "$(REF)" || (echo "Usage: make db-link REF=your-project-ref" && exit 1)
	npx supabase link --project-ref $(REF)
