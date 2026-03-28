# 技術解説

このドキュメントは、`kaikosen` の実装上の要点を把握するための技術概要です。

## 1. アーキテクチャ概要

- フロント/サーバ: SvelteKit（ファイルベースルーティング）
- UI: Svelte 5 + Tailwind CSS 4
- API: `src/routes/api/**/+server.ts` のエンドポイント
- 認証: Supabase Auth（Google OAuth）
- DB: PostgreSQL + Drizzle ORM

大きくは「SvelteKitページ（UI）」と「SvelteKit API（サーバ処理）」が同一リポジトリで動く構成です。

## 2. 技術スタックと主要コマンド

主要依存は `package.json` を参照。

- 開発: `npm run dev`
- ビルド: `npm run build`
- プレビュー: `npm run preview`
- 型/整合性チェック: `npm run check`
- Lint/Format: `npm run lint`, `npm run format`
- テスト: `npm run test`
- Drizzle: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:studio`

## 3. 認証とセッション管理

### ログインフロー

1. `/login` で Google OAuth を開始
2. `/auth/callback` で `code` をセッションへ交換
3. 以降は `hooks.server.ts` でユーザー情報を `locals` に展開

### ルート保護

`src/routes/+layout.server.ts` で以下を制御しています。

- 未ログイン: `/login` へリダイレクト
- プロフィール未作成: `/account/edit` へ誘導

## 4. データモデル（Drizzle）

`src/lib/server/db/schema.ts` の主要テーブル:

- `profile`: ユーザープロフィール
- `connection`: ユーザー同士のつながり（別名など）
- `event`: イベント情報
- `event_attendee`: イベント参加関係

DB接続は `src/lib/server/db/index.ts` で `DATABASE_URL` を使って初期化します。

## 5. API設計（責務）

主な API 群:

- `GET /api/graph`
  - トップ画面のノード/エッジ情報を返す
- `GET /api/me`
  - ログイン中ユーザーのプロフィール取得
- `POST /api/profile`, `GET /api/profile/[userId]`
  - プロフィール更新/公開プロフィール取得
- `api/connections/**`
  - つながり一覧、追加、削除、別名更新、スキャン連携、詳細取得
- `api/events/**`
  - イベント一覧/詳細、参加トグル、参加者一覧、関連参加者取得

## 6. ページごとの責務分担

- `/`
  - クライアントでグラフAPIを取得し可視化（D3）
- `/card`
  - QR表示・スキャン・接続登録
- `/calendar`, `/calendar/[slug]`
  - サーバでイベント情報を集約し、クライアントで参加操作
- `/account`, `/account/edit`
  - アカウント表示/編集
- `/profile/[userId]`, `/connect`, `/login`
  - サーバで対象データ解決、クライアントで表示と操作

## 7. 実装時の注意点

- 認証状態は `locals.user` 前提で処理する
- API追加時は `src/routes/api/**/+server.ts` に責務を閉じる
- DB変更時は `schema.ts` 更新後に Drizzle コマンドで反映する
- UIからのデータ取得は、ページ責務に応じて「`+page.server.ts` で先読み」か「クライアント fetch」を使い分ける

## 8. 参照ファイル

- `package.json`
- `src/hooks.server.ts`
- `src/routes/+layout.server.ts`
- `src/lib/server/db/index.ts`
- `src/lib/server/db/schema.ts`
- `src/routes/api/**/+server.ts`
