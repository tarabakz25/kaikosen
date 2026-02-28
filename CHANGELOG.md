# Changelog

## [Unreleased] - 2026-02-28

### Changed

#### Database & Authentication: Neon + better-auth → Supabase

- **DB接続を `@neondatabase/serverless` → `postgres` (postgres-js) に移行**
  - `src/lib/server/db/index.ts`: `drizzle-orm/neon-http` → `drizzle-orm/postgres-js`、`neon()` クライアント → `postgres(url, { prepare: false })`（Supabase connection pooler のトランザクションモードに対応）
  - `@neondatabase/serverless`、`@neondatabase/neon-js` を削除
  - `postgres@3.4.8` を追加

- **認証を `better-auth` → Supabase Auth (`@supabase/supabase-js` + `@supabase/ssr`) に移行**
  - `better-auth` を削除
  - `@supabase/supabase-js@2.98.0`、`@supabase/ssr@0.8.0` を追加
  - `src/hooks.server.ts`: `createServerClient` (SSR) でリクエストごとに Supabase クライアントを生成し `locals.supabase` に格納。`getUser()` でユーザー取得し `locals.user` に設定
  - `src/lib/auth-client.ts`: `better-auth/client` → `createBrowserClient` に変更、`supabase` としてエクスポート
  - `src/lib/server/auth.ts` を削除（不要）
  - `src/lib/server/db/auth.schema.ts` を削除（Supabase Auth が独自管理）
  - `src/routes/api/auth/[...all]/+server.ts` を削除
  - `src/routes/auth/callback/+server.ts` を新規作成。OAuth code → `exchangeCodeForSession()` で交換し `/` にリダイレクト
  - `src/routes/login/+page.svelte`: `authClient.signIn.social()` → `supabase.auth.signInWithOAuth()`、callback URL を `/auth/callback` に変更
  - `src/routes/account/+page.svelte`: `authClient.signOut()` → `supabase.auth.signOut()`
  - `src/app.d.ts`: `Locals` に `supabase: SupabaseClient` を追加、`session` フィールドを削除
  - `.env.example`: `BETTER_AUTH_SECRET`/`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` を削除、`PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` を追加

- **Supabase ダッシュボードで要設定:**
  - Google OAuth プロバイダーを有効化（Authentication → Providers）
  - Redirect URL に `[your-origin]/auth/callback` を追加

---

## [Previous] - 2026-02-28

### Changed

#### Authentication

- **認証基盤を neon-auth → better-auth に移行**
  - `better-auth@1.4.20` を dependencies に追加
  - `src/lib/server/auth.ts` を新規作成。`betterAuth()` + `drizzleAdapter` + Google OAuth provider で構成。DB は既存の `auth.schema.ts`（user/session/account/verification）をそのまま利用
  - `src/routes/api/auth/[...all]/+server.ts` を新規作成。GET/POST を `auth.handler(request)` に委譲
  - `src/lib/auth-client.ts` を `createAuthClient` (`better-auth/client`) に変更
  - `src/hooks.server.ts` を全面書き換え。`auth.api.getSession()` でセッション取得し `event.locals` に設定。Neon Auth 独自の fetch プロキシロジックを削除
  - `.env` / `.env.example` に `BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET` を追加。`NEON_AUTH_URL` / `VITE_NEON_AUTH_URL` を削除

---

### Fixed

#### Build

- **package.json** - `overrides: { estree-walker: ^3.0.3 }` を削除。`@vercel/nft@1.3.2` はCJSで `require('estree-walker')` するが、v3はESM-onlyのため `ERR_PACKAGE_PATH_NOT_EXPORTED` が発生していた。overrideを外すことでbunが適切にネスト解決（top-levelにv2、`@vitest/mocker/`以下にv3）し、Vercelビルドが通るようになった。

### Changed

#### Infrastructure

- **auth.ts** - `emailAndPassword` を削除し、Google OAuth (`socialProviders.google`) に変更。`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` 環境変数を参照。
- **schema.ts** - placeholder の `task` テーブルを削除し、`profile` / `connection` / `event` / `event_attendee` テーブルに完全置き換え。
- **auth.schema.ts** - `bun run auth:schema` で再生成（better-auth の user/session/account/verification テーブル）。
- **package.json** - `drizzle-orm`, `d3`, `qrcode`, `jsqr` を dependencies に追加。`@types/d3`, `@types/qrcode` を devDependencies に追加。
- **DB** - `bun run db:push --force` で全テーブルをマイグレーション済み。

---

### Added

#### API Routes (`src/routes/api/`)

- **GET /api/graph** - Returns all profiles as graph nodes and connections as edges. Deduplicates edges by only including pairs where `userId < targetUserId`. No auth required.
- **GET /api/me** - Returns the current user's profile. Auth required (401 if not logged in), 404 if profile not found.
- **POST /api/profile** - Upserts (insert or update) the current user's profile using `ON CONFLICT (user_id) DO UPDATE`. Body: `{ nickname, schoolName, tags }`. Auth required.
- **GET /api/profile/[userId]** - Fetches a profile by `userId` field (not profile primary key). No auth required, 404 if not found.
- **GET /api/connections** - Lists current user's connections joined with the target user's profile info. Auth required.
- **POST /api/connections** - Adds a new connection row. Body: `{ targetUserId, alias }`. Auth required.
- **GET /api/events** - Lists all events ordered by `startAt`. No auth required.
- **GET /api/events/[id]** - Fetches a single event by id. No auth required, 404 if not found.
- **POST /api/events/[id]/attend** - Toggles attendance for the current user (insert if not attending, delete if already attending). Auth required. Returns `{ attending: boolean }`.
- **GET /api/events/[id]/attendees** - Lists all attendees for an event joined with their profiles. No auth required.

#### Frontend Pages (`src/routes/`)

- **src/lib/types.ts** - Shared TypeScript types: `Profile`, `Connection`, `Event`, `EventAttendee`, `GraphNode`, `GraphEdge`.
- **src/lib/auth-client.ts** - better-auth client instance via `createAuthClient()` from `better-auth/svelte`.
- **src/routes/+layout.svelte** - Root layout with bottom navigation bar (つながり/カード/イベント/アカウント). Nav is only rendered when `data.user` is set. Uses `page` from `$app/state` for active route highlighting.
- **src/routes/+page.svelte** - Network graph page. Fetches `/api/graph` on mount, renders a D3 force-directed SVG graph with zoom/drag. Nodes are colored by school name hash. Clicking a node shows a bottom-sheet modal with profile details.
- **src/routes/login/+page.svelte** - Google OAuth login page via `authClient.signIn.social()`.
- **src/routes/account/+page.svelte** - Profile settings form (nickname, school name, tags). Tags are added via Enter/comma keydown and removed with ×. POSTs to `/api/profile`. Includes logout button.
- **src/routes/calendar/+page.svelte** - Event list page. Fetches events from `data.events` (server load). Shows title, date, location, and attendee count per event.
- **src/routes/calendar/[slug]/+page.svelte** - Event detail page. Shows event info, toggle attendance button (POST `/api/events/[id]/attend`), and attendee list with connection badges.
- **src/routes/card/+page.svelte** - QR card page with two tabs: "表示" (shows QR code via `qrcode` library linking to `/connect?uid=...`) and "スキャン" (camera scan via `getUserMedia` + `jsQR`). On successful scan shows modal to enter alias, then POSTs to `/api/connections`.
- **src/routes/connect/+page.svelte** - Web-link connection page. Fetches target user profile from `/api/profile/[uid]` using `?uid=` query param. Shows profile and alias input, then POSTs to `/api/connections`.

#### Server-side Load Functions

- **src/routes/+layout.server.ts** - Root layout load: checks session, redirects unauthenticated users away from protected routes (`/`, `/card`, `/calendar`, `/account`), redirects authenticated users without a profile to `/account`, passes `user` and `userProfile` to all pages.
- **src/routes/+page.server.ts** - Minimal root page load (returns empty object; redirect handled by layout).
- **src/routes/login/+page.server.ts** - Redirects already-authenticated users to `/`.
- **src/routes/account/+page.server.ts** - Redirects unauthenticated users to `/login`.
- **src/routes/card/+page.server.ts** - Redirects unauthenticated users to `/login`.
- **src/routes/calendar/+page.server.ts** - Loads all events with per-event attendee counts; loads connection user IDs for the current user if logged in.
- **src/routes/calendar/[slug]/+page.server.ts** - Loads a single event (404 if not found), its attendees with profiles, current user's attendance status, and connection user IDs.
