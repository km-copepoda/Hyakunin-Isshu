import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';

export const orderModeEnum = pgEnum('order_mode', ['sequential', 'reverse', 'random']);
export const gameModeEnum = pgEnum('game_mode', ['segments', 'author']);

export const scores = pgTable(
  'scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull(),
    name: varchar('name', { length: 16 }).notNull(),
    chapter: integer('chapter').notNull(),
    orderMode: orderModeEnum('order_mode').notNull(),
    gameMode: gameModeEnum('game_mode').notNull().default('segments'),
    timeMs: integer('time_ms').notNull(),
    misses: integer('misses').notNull(),
    playedAt: timestamp('played_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rankingIdx: index('scores_ranking_idx').on(
      t.chapter,
      t.gameMode,
      t.orderMode,
      t.playedAt,
    ),
  }),
);

export type ScoreRow = typeof scores.$inferSelect;
export type NewScoreRow = typeof scores.$inferInsert;
