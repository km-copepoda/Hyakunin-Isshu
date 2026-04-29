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

export const scores = pgTable(
  'scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    playerId: uuid('player_id').notNull(),
    name: varchar('name', { length: 16 }).notNull(),
    chapter: integer('chapter').notNull(),
    orderMode: orderModeEnum('order_mode').notNull(),
    timeMs: integer('time_ms').notNull(),
    misses: integer('misses').notNull(),
    playedAt: timestamp('played_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rankingIdx: index('scores_ranking_idx').on(t.chapter, t.orderMode, t.playedAt),
  }),
);

export type ScoreRow = typeof scores.$inferSelect;
export type NewScoreRow = typeof scores.$inferInsert;
