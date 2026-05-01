import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import {
  validateChapterAndGameModeQuery,
  ORDER_MODES,
  type OrderMode,
} from '@/lib/validation';
import { buildRanking, SEVEN_DAYS_MS, type ScoreRecord } from '@/lib/ranking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = validateChapterAndGameModeQuery({
    chapter: url.searchParams.get('chapter') ?? undefined,
    gameMode: url.searchParams.get('gameMode') ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { chapter, gameMode } = result.data;
  const now = new Date();
  const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);

  const rows = await db
    .select({
      orderMode: schema.scores.orderMode,
      playerId: schema.scores.playerId,
      name: schema.scores.name,
      timeMs: schema.scores.timeMs,
      misses: schema.scores.misses,
      playedAt: schema.scores.playedAt,
    })
    .from(schema.scores)
    .where(
      and(
        eq(schema.scores.chapter, chapter),
        eq(schema.scores.gameMode, gameMode),
        gt(schema.scores.playedAt, cutoff),
      ),
    );

  const grouped: Record<OrderMode, ScoreRecord[]> = {
    sequential: [],
    reverse: [],
    random: [],
  };
  for (const r of rows) {
    grouped[r.orderMode as OrderMode].push({
      playerId: r.playerId,
      name: r.name,
      timeMs: r.timeMs,
      misses: r.misses,
      playedAt: r.playedAt,
    });
  }

  const rankings = Object.fromEntries(
    ORDER_MODES.map((mode) => [
      mode,
      buildRanking(grouped[mode], now).map((e) => ({
        rank: e.rank,
        playerId: e.playerId,
        name: e.name,
        timeMs: e.timeMs,
        misses: e.misses,
        playedAt: e.playedAt.toISOString(),
      })),
    ]),
  ) as Record<OrderMode, unknown[]>;

  return NextResponse.json(
    { chapter, gameMode, rankings },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
