# セットアップ手順

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:3000` でゲームを起動できる。ランキング機能を使う場合は下記の DB セットアップが必要。

## Vercel Postgres セットアップ（ランキング機能用）

ランキングは Vercel Postgres（Neon backed）を使用する。

### 1. Vercel ダッシュボードで DB を作成

1. プロジェクトを Vercel にデプロイ（または既存プロジェクトを選択）
2. Storage タブ → Create Database → **Postgres** を選択
3. 名前・リージョン（東京推奨）を指定して作成
4. 自動で `POSTGRES_URL` などの環境変数がプロジェクトに紐付く

### 2. ローカルに環境変数を取り込む

```bash
npx vercel link    # プロジェクトと紐付け（初回のみ）
npx vercel env pull .env.local
```

`.env.local` に `POSTGRES_URL` 等が書き込まれる。

### 3. マイグレーション実行

**Vercel 本番環境では自動で当たる**（`vercel-build` スクリプトが `drizzle-kit migrate` を実行する）ので、初回デプロイ時に自動でテーブルが作成される。

ローカルで動作確認したい場合のみ手動実行：

```bash
npm run db:push       # 開発用（schema.ts から直接同期）
# または
npx drizzle-kit migrate  # 本番と同じ migration ファイルを当てる
```

### 4. 動作確認

```bash
npm run dev
```

ステージをクリアし、名前を入れて「ランキングに登録」を押す → `/ranking/1` で表示されれば OK。

## テスト

```bash
npm test           # 1回だけ実行
npm run test:watch # ウォッチモード
```

## マイグレーション差分の追加

スキーマ（`lib/db/schema.ts`）を変更したら：

```bash
npm run db:generate   # drizzle/ 配下に SQL 差分が生成される
npm run db:push       # DB に反映
```

## デプロイ

main ブランチへ push すると Vercel が自動デプロイ。Vercel Postgres は同一プロジェクトに紐付いているため、本番でも特に追加設定不要。
