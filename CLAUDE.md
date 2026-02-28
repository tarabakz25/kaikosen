# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev          # 開発サーバー起動
bun run build        # プロダクションビルド
bun run check        # svelte-check (型チェック)
bun run lint         # prettier + eslint チェック
bun run format       # prettier フォーマット
bun run test         # 全テスト実行 (--run)
bun run test:unit    # テスト watch モード

bun run db:push      # Drizzle スキーマをDBに直接反映
bun run db:generate  # マイグレーションファイル生成
bun run db:migrate   # マイグレーション実行
bun run db:studio    # Drizzle Studio 起動
```

テストは2プロジェクト構成:
- `client`: `*.svelte.spec.ts` → Playwright (Chromium, headless)
- `server`: `*.spec.ts` (非svelte) → Node環境

## Architecture

**SvelteKit + Vercel adapter** のモバイルファーストWebアプリ。高専生同士のつながりを可視化するSNS。

### 認証・セッション
- Supabase Auth (Google OAuth) を使用
- `src/hooks.server.ts`: リクエストごとに `createServerClient` で `locals.supabase` と `locals.user` を設定
- `src/lib/auth-client.ts`: ブラウザ側 `createBrowserClient` を `supabase` としてエクスポート
- OAuth callback: `/auth/callback` → `exchangeCodeForSession()` → `/` にリダイレクト

### データベース
- Drizzle ORM + postgres-js + Supabase PostgreSQL
- スキーマ: `src/lib/server/db/schema.ts` (profile / connection / event / event_attendee)
- DB接続: `src/lib/server/db/index.ts` — `{ prepare: false }` 必須 (Supabase pooler トランザクションモード対応)
- `DATABASE_URL` はSupabaseダッシュボードの **Transaction pooler** 接続文字列を使用

### ルーティングと認証ガード
- `src/routes/+layout.server.ts`: 保護ルート (`/`, `/card`, `/calendar`, `/account`) へのアクセスを未認証ユーザーから `/login` へリダイレクト
- プロフィール未設定ユーザーは `/account/edit` へリダイレクト

### 主要ページ
| ルート | 概要 |
|--------|------|
| `/` | D3 force-directed グラフ。connectionした相手のみノード表示 |
| `/card` | QRコード表示タブ + カメラスキャンタブ (jsQR) |
| `/connect` | QRスキャン後の接続確認ページ (`?uid=` クエリパラメータ) |
| `/calendar` | イベント一覧 (DBが空の場合モックデータを返す) |
| `/calendar/[slug]` | イベント詳細・参加トグル |
| `/account` | プロフィール表示専用 |
| `/account/edit` | プロフィール編集フォーム |
| `/login` | Google OAuthサインイン |

### API Routes (`src/routes/api/`)
- `GET /api/graph` — グラフ用ノード/エッジ (認証不要)
- `GET/POST /api/profile`, `GET /api/profile/[userId]`
- `GET /api/me`
- `GET/POST /api/connections`
- `GET /api/events`, `GET /api/events/[id]`, `POST /api/events/[id]/attend`, `GET /api/events/[id]/attendees`

### 環境変数 (`.env`)
```
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
DATABASE_URL=   # Supabase Transaction pooler 接続文字列
ORIGIN=
```

### Supabaseダッシュボード設定
- Authentication → Providers → Google OAuth を有効化
- Redirect URL に `[origin]/auth/callback` を追加

## 開発ルール
- コード変更後は `CHANGELOG.md` を更新し、`/smart-commit` でコミットする
