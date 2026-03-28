# Changelog

## [Unreleased] - 2026-03-01

### Changed

#### CI ワークフロー分割

- 単一の `ci.yml` を廃止し、`ci-lint.yml` / `ci-typecheck.yml` / `ci-test.yml` / `ci-build.yml` に分離（PR 上でジョブが別チェックとして並列実行される）
- `CONTRIBUTING.md` の Actions 説明を分割後の構成に合わせて更新

#### コントリビューション手順の更新

- `CONTRIBUTING.md` を kaikosen 現行スタック（SvelteKit、Bun、Vitest 二層、Drizzle、環境変数）に合わせて全面刷新。旧 `kmc-platform` 向けの npm / React 記述を削除
- `.github/PULL_REQUEST_TEMPLATE.md` のチェックコマンドを `bun` ベースに更新し `test` / `check` を明記
- `.github/workflows/ci.yml` の型チェックを実在スクリプト `bun run check` に修正。`format-check` ステップは `lint` 内の Prettier チェックと重複のため削除

### Fixed

#### ESLint / 型 / CI テストの修正（recommended 準拠）

- 内部リンク・`goto` に `$app/paths` の `resolve()` を利用（`navItems` は `as const` でルート型に一致）。クエリ付き `goto` はルール上アンマッチのため当該箇所のみ `eslint-disable-next-line`
- `{#each}` にキーを追加。D3 周りの `any` を `GraphSimNode` / `GraphSimLink` に置換。`calendar/+page.server.ts` の `prefer-const` 対応
- 外部イベント URL の `<a>` に `rel="external"` を追加（`no-navigation-without-resolve` の例外）
- 参加者リストは `resolve()` を分岐で直接渡すため `{#snippet}` で本文を共通化
- `card/+page.svelte`: キャンバス／ビデオの ref 型と `videoEl` の null ガード
- `.github/workflows/ci-test.yml`: Vitest browser（Playwright）用に `bunx playwright install chromium` を追加
- `src/routes/page.svelte.spec.ts`: 実 DOM に合わせ SVG の存在を検証し、`data` を明示的に渡す

#### QRスキャンフロー: pending.userId → targetUserId バグ修正・リダイレクト先を `/` に統一

- `src/routes/+layout.svelte`: グローバルpoll の `goto` で `body.pending.userId`（自分のID）を使っていたバグを `body.pending.targetUserId` に修正。また `/card` ページではローカルpollがあるためグローバルpollをスキップするよう条件追加
- `src/routes/card/+page.svelte`: 二つ名登録成功後（scanned/pending 両方）に scan 再起動していたのを `goto('/')` に変更
- `src/routes/connect/+page.svelte`: 登録成功後のリダイレクトを `/profile/...` から `/` に変更

#### QRスキャン: 二つ名登録画面が表示されない問題

- `src/routes/connect/+page.server.ts`: プロフィールへのリダイレクトを廃止。`/connect?uid=` で相手プロフィールを取得し二つ名登録用データを返す
- `src/routes/connect/+page.svelte`: 二つ名入力フォームを表示。登録後は相手プロフィールへ遷移
- `src/routes/+layout.server.ts`: `/connect` を保護ルートに追加（未ログイン時はログインへ）

### Added

#### ページ遷移: ランドルト環スピナー

- `src/routes/+layout.svelte`: `navigating` ($app/state) を利用し、ページ遷移中に全画面オーバーレイでランドルト環（C字形・accent色）スピナーを表示

#### QRスキャンされた側のグローバル自動リダイレクト

- `src/routes/+layout.svelte`: pending接続ポーリング (2秒間隔) をレイアウトに移動。ログイン中であればどのページにいてもQRスキャンを検知し `/connect?uid=` へリダイレクト
- `src/routes/card/+page.svelte`: ローカルのpolling実装 (`pollIntervalId`, `startPoll`, `stopPoll`) を削除。レイアウトのグローバルポーリングに一本化

---

### Added

#### UI: ロゴ配置

- `src/routes/login/+page.svelte`: ランディングページ中央に `logo.webp` を表示。`h1` テキストを削除しロゴ画像に置換
- `src/routes/+layout.svelte`: 認証済みユーザー向けに sticky ヘッダーを追加し左上にロゴを表示

#### グラフ: ノードをGoogle Avatarアイコンに変更

- `src/routes/+page.svelte`: D3ノードを `<circle>` から `<g>` ベースに変更。`avatarUrl` がある場合は SVG `<image>` + `clipPathUnits="objectBoundingBox"` で円形クリップ、ない場合は背景色+頭文字のフォールバック表示。ポップアップアイコンも `<img>` または頭文字に対応

#### グラフ: イベント共通参加回数の炎エフェクト

- `src/lib/types.ts`: `GraphEdge` に `sharedEventCount: number` フィールドを追加
- `src/routes/api/graph/+server.ts`: 自分が参加したイベントと接続ユーザーの共通参加数を集計し `sharedEventCount` をエッジに付与
- `src/routes/+page.svelte`: SVG `<defs>` に3段階の橙色グローフィルター (`flame-1/2/3`) を追加。sharedEventCount に応じてノードに適用。ポップアップに `🔥 一緒に参加: N回` を表示

#### QRカード: スキャンされた側のpending自動遷移

- `src/lib/server/db/schema.ts`: `connection` テーブルに `(userId, targetUserId)` の複合 unique インデックスを追加
- `src/routes/api/connections/+server.ts`: GET に `?pending=true` クエリ対応追加 (alias='' かつ targetUserId=自分 の接続を返す)。POST を upsert に変更 (`onConflictDoUpdate`)
- `src/routes/card/+page.svelte`: 表示タブ中に2秒間隔で pending ポーリングを実行。pending を検知したら `/connect?uid=` にリダイレクト

#### イベント: 参加ボタン押下時の即時リスト反映

- `src/routes/calendar/[slug]/+page.svelte`: `localAttendees` を `$state` で保持し楽観的更新を実装。参加/取り消し時にリストを即時更新、API失敗時は元に戻す。参加者数表示も `localAttendees.length` に変更

### Added / Fixed

#### グラフ: ノードクリック時に二つ名を表示

- `src/lib/types.ts`: `GraphEdge` に `alias: string` フィールドを追加
- `src/routes/api/graph/+server.ts`: エッジに `alias` を含め、`currentUserId` をレスポンスに追加
- `src/routes/+page.svelte`: `currentUserId`・`graphEdges` を保持し、ノードクリック時に対応エッジから `alias` を取得。ポップアップに「二つ名」として表示

#### つながり機能: 双方向接続の自動作成

- `src/routes/api/connections/+server.ts`: POST 時に A→B を作成後、B→A の逆方向 connection が存在しなければ自動挿入。グラフがスキャンした側・された側の両方に反映される

#### QRカード機能: タブ切替後の再描画修正

- `src/routes/card/+page.svelte`: QR描画を `onMount` から `$effect` に変更。スキャンタブへ切替後に表示タブへ戻ってもキャンバスバインディングが再評価され QR が再描画される

#### イベント機能: 過去コンテスト共通参加者表示

- `src/routes/calendar/[slug]/+page.server.ts`: モックイベント (mock-1〜mock-4) 用に `MOCK_ATTENDEES` を追加。各参加者に `pastContests: string[]` フィールドを持たせ、DB 参加者は `[]` で補完
- `src/routes/calendar/[slug]/+page.svelte`: 「参加する」クリック時に過去コンテスト選択モーダルを表示 (localStorage に永続化)。共通コンテスト数で参加者をソートし「共通N個」バッジを表示

#### プロフィール: 過去コンテスト参加記録の設定

- `src/lib/server/db/schema.ts`: `profile` テーブルに `pastContests text[]` カラムを追加
- `src/lib/contests.ts`: `PAST_CONTESTS` 定数を共有モジュールとして切り出し
- `src/routes/api/profile/+server.ts`: `pastContests` フィールドを受け取って保存
- `src/routes/account/edit/+page.svelte`: 過去コンテスト選択チェックボックスUI を追加

#### イベント機能: モックユーザー削除・プロフィール連携

- `src/routes/calendar/[slug]/+page.server.ts`: MOCK_ATTENDEES を完全削除。参加者クエリに `pastContests` を追加
- `src/routes/calendar/[slug]/+page.svelte`: localStorage/モーダルを廃止。自分のプロフィールの `pastContests` を使って共通コンテスト数を計算・ソート・バッジ表示

#### イベント機能: 参加者をDB実データに反映

- `src/routes/calendar/[slug]/+page.server.ts`: mock イベントでも `isAttending` を DB から取得するよう修正。参加者リストも DB の実際の参加者を優先し、未参加のモックユーザーを後続追加する方式に変更

## [Unreleased] - 2026-02-28

### Changed (UI/UX)

#### レイアウト・画面デザイン改善

- **レイアウト**: `min-h-screen` → `h-screen overflow-y-auto` に変更し、ボディスクロールを禁止（モバイルアプリ的UX）
  - `src/routes/+layout.svelte`

- **つながり画面（グラフ）: ノードポップアップを中央表示に変更**
  - `src/routes/+page.svelte`: `items-end` → `items-center`、`rounded-t-2xl` → `rounded-2xl`、背景オーバーレイに `p-4` 追加

- **つながり画面（グラフ）: connectionした人のみノード表示**
  - `src/routes/api/graph/+server.ts`: 全プロフィールを返すのを廃止し、ログインユーザーの connections に含まれるユーザーのみ返すように変更（`inArray` フィルタ追加）

- **イベント画面: モックデータ追加**
  - `src/routes/calendar/+page.server.ts`: DBにイベントが0件の場合、4件のモックイベント（ハッカソン・プロコン・LT会・ロボコン）を返す

- **アカウント画面: 表示専用レイアウトにリデザイン**
  - `src/routes/account/+page.svelte`: フォームを除去し、Googleアバター・ニックネーム・高専名・タグの表示専用ページに変更
  - `src/routes/account/edit/+page.svelte` (新規): 既存のプロフィール編集フォームを移設。保存後は `/account` に遷移
  - `src/routes/account/edit/+page.server.ts` (新規): 未ログイン時は `/login` にリダイレクト

- **未プロファイルユーザーのリダイレクト先を修正**
  - `src/routes/+layout.server.ts`: プロファイル未設定ユーザーのリダイレクト先を `/account` → `/account/edit` に変更。`/account/edit` をリダイレクト除外パスに追加

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
