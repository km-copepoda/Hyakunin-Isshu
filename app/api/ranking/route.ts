import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '@/lib/db';
import { validateRankingQuery } from '@/lib/validation';
import { buildRanking, SEVEN_DAYS_MS, type ScoreRecord } from '@/lib/ranking';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const result = validateRankingQuery({
    chapter: url.searchParams.get('chapter') ?? undefined,
    order: url.searchParams.get('order') ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { chapter, orderMode } = result.data;
  const now = new Date();
  const cutoff = new Date(now.getTime() - SEVEN_DAYS_MS);

  const rows = await db
    .select({
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
        eq(schema.scores.orderMode, orderMode),
        gt(schema.scores.playedAt, cutoff),
      ),
    );

  const records: ScoreRecord[] = rows.map((r) => ({
    playerId: r.playerId,
    name: r.name,
    timeMs: r.timeMs,
    misses: r.misses,
    playedAt: r.playedAt,
  }));

  const ranking = buildRanking(records, now);
  return NextResponse.json({
    chapter,
    orderMode,
    ranking: ranking.map((r) => ({
      rank: r.rank,
      playerId: r.playerId,
      name: r.name,
      timeMs: r.timeMs,
      misses: r.misses,
      playedAt: r.playedAt.toISOString(),
    })),
  });
}
