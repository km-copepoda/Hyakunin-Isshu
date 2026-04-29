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
