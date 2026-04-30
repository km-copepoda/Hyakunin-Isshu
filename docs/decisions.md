# アーキテクチャ決定記録

## 2026-04-29: 章ごとスコアランキング機能の導入

### 決定内容
- 章クリア時のタイム・ミス数を Vercel Postgres に保存し、章×出題順ごとにランキングを表示する
- スコア送信は章クリア時のみ。途中離脱は記録対象外
- 1章 = 10首通しの合計タイム + 通しミス数を1スコアとして扱う
- 出題順（順順 / 逆順 / ランダム）ごとにランキングを分けて表示
- ランキング表示: 過去7日間（playedAt から 7 日以内）のスコアのみ対象。プレイヤー単位でベスト1行に集約し、TOP20まで表示
- ソート規約: `timeMs ASC, misses ASC, playedAt ASC`（早い人が上、同タイムならミス少が上、それも同じなら早く出した人が上）
- ランキングは認証なしの公開ページ。誰でも閲覧可能（家族・友人向けの軽量機能）

### 本人識別
- localStorage に `playerId`（uuid）を保存し、スコアはこの ID 単位で管理
- 表示名（name）は同 playerId で変更可能。スコアごとに登録時の名前をスナップショットとして保存
- 別端末・別ブラウザは別 playerId（=別人扱い）で許容

### 技術選定
- DB: **Vercel Postgres**（Neon backed、Vercel Marketplace 経由で契約）
  - 無料 Hobby 枠で十分（想定データ量: 100スコア/日 × 7日 = 700アクティブ行程度）
  - SQL の `WHERE playedAt > NOW() - INTERVAL '7 days'` と `DISTINCT ON (player_id)` で要件が素直に書ける
- ORM: **Drizzle ORM**（軽量・サーバーレス相性◎・型安全）
- テスト: **vitest**（Hyakunin-Isshu プロジェクトに新規導入）

### Redis（Vercel KV）を選ばなかった理由
- 複合ソートキー（time → miss → playedAt）を Sorted Set で扱うには score を複合エンコードする必要があり、テストしづらい
- 7日ウィンドウのため Sorted Set にメンバー単位 TTL を持たせられず、別途 timestamp 保持や日次 cleanup が必要
- playerId 単位ベスト集約で二重 ZSET 管理が必要
- 上記のため、SQL で素直に書ける Postgres を選択

### 不正対策（最小限）
- サーバー側で timeMs の下限チェック（章合計が極端に短いスコアを拒否）
- 完全な改ざん防止はせず、家族・友人向けと割り切る

### URL設計
- 章選択画面の各章カードに「ランキング」リンクを追加
- ランキングページ: `/ranking/[chapter]` （chapter = 1〜10）
- 出題順の切り替えはページ内タブ（順順 / 逆順 / ランダム）

### データモデル
```
scores
  id          uuid PK
  player_id   uuid       -- localStorage 由来
  name        varchar(16) -- 登録時の表示名スナップショット
  chapter     int         -- 1..10
  order_mode  enum('sequential', 'reverse', 'random')
  time_ms     int
  misses      int
  played_at   timestamptz default now()
  index (chapter, order_mode, played_at)
```

### 理由
- 既存ゲームは純フロントで完結していたが、章ごとにベストタイムを共有できる軽量ランキングを加えることで再プレイ動機を作る
- 1週間のスライディングウィンドウにすることで、上位独占の継続を防ぎ「直近の腕前比べ」感を演出する
- TOP20 までで十分な可視性を確保しつつ、無料枠での読み取りコストも抑える

## 2026-04-30: ランキング表示件数を TOP20 → TOP10 に変更

### 決定内容
- `DEFAULT_TOP_N` を 20 → 10 に変更
- 称号データ `RANK_TITLES` も 20 件 → 10 件に縮小（11位以降の歌人を削除）
- 画面表記を「名うての歌詠み 二十選 / 上位20名」→「名うての歌詠み 十選 / 上位10名」に統一

### 理由
- 1章単位のスコアでTOP20まで揃える機会が少なく、空欄や水増し感が出やすかった
- 10名に絞ることで「実力者として認められた」希少性が増し、称号の重みも増す
- DB行数・レンダリングコストも軽くなる

## 2026-04-29: Service Worker のキャッシュ戦略を経路別に分離

### 決定内容
- 旧 `public/sw.js` は全 GET を cache-first でキャッシュしていたが、これを以下の3経路に分離：
  - **`/api/*`**: キャッシュ完全スキップ（毎回ネットワーク）
  - **ナビゲーション（HTML）**: network-first、オフライン時のみキャッシュフォールバック
  - **静的アセット（CSS/JS/画像）**: 従来どおり cache-first
- `CACHE_NAME` を `hyakunin-v1` → `hyakunin-v2` に更新し、`activate` で旧キャッシュを破棄

### 理由
- スマホで PWA インストール済みのユーザーがランキング画面を開いた際、SW がキャッシュした古い `/api/ranking` レスポンスを返し続けスコアが反映されない不具合があった
- API は動的データのためキャッシュしてはいけない一方、静的アセットはキャッシュしないと PWA のオフライン体験が損なわれる。経路別に戦略を切るのが標準的
- `CACHE_NAME` バンプにより、既存ユーザー端末でも次回アクセス時に旧キャッシュが自動で破棄される

## 2026-04-29: ランキング画面をタブ廃止して3順序を1画面表示

### 決定内容
- `/ranking/[chapter]` ページの出題順タブ（順順/逆順/ランダム）を廃止し、3つの順序を縦並びで1画面に表示する
- API `GET /api/ranking?chapter=X` は `order` 引数を取らなくなり、3順序のランキングをまとめて返す
- DB クエリは章単位で1回（`WHERE chapter=? AND playedAt > now()-7d`）。サーバー側で順序ごとにグルーピングし、`buildRanking` を3回適用
- 関連: `validateRankingQuery` を `validateChapterQuery` に置き換え（`order` 検証は不要になった）

### 理由
- タブ切り替えのたびに API リクエストが飛ぶ仕様だと、Vercel 無料枠の関数実行回数を無駄に消費する
- 1章ぶんの3順序は同じ DB アクセスで取得できる（chapter 単位のインデックスを共有）ため、1リクエストにまとめる方が効率的
- 縦並びにしても1章ぶんなので画面の長さが過剰になることはなく、3順序を見比べたいユースケースにも合致する

## 2026-04-29: Vercel デプロイ時にマイグレーションを自動適用

### 決定内容
- `package.json` に `vercel-build` スクリプトを追加し、Vercel 本番ビルド時に `drizzle-kit migrate && next build` を実行する
- `vercel-build` は Vercel が `build` よりも優先して使う公式仕様。ローカルの `npm run build` は従来通り `next build` のみで影響なし
- 初回マイグレーション SQL（`drizzle/0000_*.sql`）の `CREATE TYPE` を `DO $$ ... EXCEPTION WHEN duplicate_object ... $$` でベキ等化。`db:push` で先に当てた DB でも `migrate` を再実行できるようにする

### 理由
- 環境変数の追加・スキーマ変更の度に手動で `db:push` を打つフローは事故が起きやすい（環境差・実行忘れ）
- `vercel-build` を使えば Vercel 上のデプロイで自動的に最新 migration が当たり、ローカル動作には影響しないため切り分けが綺麗
- migration を idempotent にしたのは、過去に `db:push` で先回りした DB でも `drizzle-kit migrate` の `__drizzle_migrations` テーブル登録が走り、以降は順次差分のみが適用されるようにするため
