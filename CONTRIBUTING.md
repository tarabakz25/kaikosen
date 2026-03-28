# Contributing to kaikosen

高専生向けのつながり可視化 Web アプリ（SvelteKit + Supabase + Drizzle）へのコントリビューション手順です。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [よく使うコマンド](#よく使うコマンド)
- [環境変数](#環境変数)
- [テスト](#テスト)
- [データベース（Drizzle）](#データベースdrizzle)
- [ブランチと PR](#ブランチと-pr)
- [コミットメッセージ](#コミットメッセージ)
- [Issue](#issue)
- [コードスタイルの目安](#コードスタイルの目安)
- [CHANGELOG](#changelog)

---

## 開発環境のセットアップ

### 必要なもの

| ツール                 | 備考                                                                |
| ---------------------- | ------------------------------------------------------------------- |
| Node.js                | `package.json` の `engines` は **>= 20**                            |
| [Bun](https://bun.sh/) | CI と同様に **Bun** でインストール・実行する想定（`bun.lock` あり） |

### 手順

```sh
git clone https://github.com/<org-or-user>/kaikosen.git
cd kaikosen

cp .env.example .env
# .env を編集（後述の環境変数）

bun install
bun run dev
```

`npm` でも動くスクリプト定義になっているが、ローカルと CI を揃えるなら **Bun 推奨**。

---

## よく使うコマンド

| コマンド            | 説明                             |
| ------------------- | -------------------------------- |
| `bun run dev`       | 開発サーバー（Vite / SvelteKit） |
| `bun run build`     | プロダクションビルド             |
| `bun run preview`   | ビルド結果のプレビュー           |
| `bun run check`     | `svelte-check` による型チェック  |
| `bun run lint`      | Prettier（チェック）+ ESLint     |
| `bun run format`    | Prettier で自動整形              |
| `bun run test`      | Vitest 全テスト（`--run`）       |
| `bun run test:unit` | Vitest ウォッチモード            |

Pull Request を出す前に、少なくとも **`bun run lint`** と **`bun run check`** と **`bun run test`** と **`bun run build`** が通る状態にしてください（GitHub Actions でも同様の順で実行されます）。

---

## 環境変数

`.env.example` をベースに `.env` を用意します。

- **Supabase**: `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- **アプリ**: `ORIGIN`（OAuth リダイレクト等で使う公開オリジン）
- **DB**: `DATABASE_URL` — Supabase ダッシュボードの **Transaction pooler** 接続文字列（Drizzle / サーバー処理で使用）

Google OAuth や Redirect URL（`/auth/callback`）は Supabase 側設定も必要です。詳細は `CLAUDE.md` を参照。

---

## テスト

Vitest の **2 プロジェクト構成**です（`vitest.config.ts`）。

| プロジェクト | 対象                                                        | 実行環境                           |
| ------------ | ----------------------------------------------------------- | ---------------------------------- |
| `client`     | `src/**/*.svelte.spec.ts` など（svelte テスト）             | Playwright（Chromium・ヘッドレス） |
| `server`     | `src/**/*.{test,spec}.{js,ts}`（svelte ブラウザテスト以外） | Node                               |

初回やブラウザプロジェクトのみ動かす場合は Playwright のブラウザ取得が必要なことがあります（`bunx playwright install` 等）。

---

## データベース（Drizzle）

| コマンド              | 説明                         |
| --------------------- | ---------------------------- |
| `bun run db:push`     | スキーマを DB に反映（push） |
| `bun run db:generate` | マイグレーションファイル生成 |
| `bun run db:migrate`  | マイグレーション適用         |
| `bun run db:studio`   | Drizzle Studio               |

スキーマは主に `src/lib/server/db/schema.ts`、接続は `src/lib/server/db/index.ts` まわりを確認してください。

---

## ブランチと PR

### ブランチ命名の例

チームの運用がなければ、次のようなプレフィックスで十分です。

- `feat/…` 新機能
- `fix/…` バグ修正
- `docs/…` ドキュメントのみ
- `chore/…` 設定・依存更新など

Issue がある場合は番号やスラッグを含めると追いやすいです。

### PR のベースブランチ

**リポジトリのデフォルトブランチ**（多くは `main`）向けが標準です。別ブランチ（例: `develop`）にマージする運用の場合は、その方針に合わせてください。

### PR 前のチェック

- 関連 Issue の重複・方針が取れていること
- `bun run lint` / `bun run check` / `bun run test` / `bun run build` が通ること
- UI 変更時は PR 説明やスクリーンショットで確認しやすくすること

GitHub 上では **PR テンプレート**（`.github/PULL_REQUEST_TEMPLATE.md`）が開きます。チェックリストを埋めてからレビュー依頼してください。

---

## コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/) 形式を推奨します。

| type       | 用途                                       |
| ---------- | ------------------------------------------ |
| `feat`     | 新機能                                     |
| `fix`      | バグ修正                                   |
| `docs`     | ドキュメントのみ                           |
| `style`    | 見た目・フォーマット（挙動は変えない）     |
| `refactor` | リファクター（機能追加・バグ修正ではない） |
| `test`     | テスト                                     |
| `chore`    | ビルド・依存・ツールまわり                 |
| `perf`     | 性能改善                                   |
| `revert`   | 取り消し                                   |

例: `feat(card): QR スキャン後の遷移を改善`

---

## Issue

起票前に **既存 Issue と重複していないか** 検索してください。

テンプレート（`.github/ISSUE_TEMPLATE/`）:

- バグ報告: 再現手順・期待動作・実際の動作・環境・ログやスクショ
- 機能要望: 背景・提案・代替案

---

## コードスタイルの目安

### TypeScript

- 安易な `any` は避け、不明なら `unknown` や具体型で表現する
- 根拠のない型アサーション（`as`）を減らす
- プロジェクトの ESLint / Prettier 設定に従う（ルール変更は Issue で相談）

### SvelteKit

- ルート・ページ・サーバーロードは `src/routes/` の規約に沿う
- 共有ロジック・型・クライアント用モジュールは `src/lib/` を使う
- UI は Tailwind CSS（v4）前提。コンポーネントの責務は小さく保つ

### レビューコメントの目安（参考）

| ラベル     | 意味                                 |
| ---------- | ------------------------------------ |
| **Must**   | マージ前に修正が必要                 |
| **Should** | 強く推奨。合意すれば後回しもあり得る |
| **Nit**    | 好み・細部。任意                     |

---

## CHANGELOG

コードや挙動に触れる変更を入れた場合は、**`CHANGELOG.md`** の `[Unreleased]` に追記することを推奨します（リリースノートのたたき台になります）。
