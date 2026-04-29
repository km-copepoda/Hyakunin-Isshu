export type ScoreRecord = {
  playerId: string;
  name: string;
  timeMs: number;
  misses: number;
  playedAt: Date;
};

export type RankingEntry = ScoreRecord & { rank: number };

export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_TOP_N = 20;

export function compareScore(a: ScoreRecord, b: ScoreRecord): number {
  if (a.timeMs !== b.timeMs) return a.timeMs - b.timeMs;
  if (a.misses !== b.misses) return a.misses - b.misses;
  return a.playedAt.getTime() - b.playedAt.getTime();
}

export function filterRecentScores(scores: ScoreRecord[], now: Date): ScoreRecord[] {
  const cutoff = now.getTime() - SEVEN_DAYS_MS;
  return scores.filter((s) => s.playedAt.getTime() > cutoff);
}

export function aggregateBestPerPlayer(scores: ScoreRecord[]): ScoreRecord[] {
  const byPlayer = new Map<string, ScoreRecord>();
  for (const s of scores) {
    const existing = byPlayer.get(s.playerId);
    if (!existing || compareScore(s, existing) < 0) {
      byPlayer.set(s.playerId, s);
    }
  }
  return Array.from(byPlayer.values());
}

export function buildRanking(
  scores: ScoreRecord[],
  now: Date,
  topN: number = DEFAULT_TOP_N,
): RankingEntry[] {
  const recent = filterRecentScores(scores, now);
  const best = aggregateBestPerPlayer(recent);
  best.sort(compareScore);
  return best.slice(0, topN).map((s, i) => ({ ...s, rank: i + 1 }));
}
