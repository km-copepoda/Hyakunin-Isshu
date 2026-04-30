import { describe, it, expect } from 'vitest';
import {
  filterRecentScores,
  aggregateBestPerPlayer,
  compareScore,
  buildRanking,
  type ScoreRecord,
} from '@/lib/ranking';

const NOW = new Date('2026-04-29T12:00:00Z');
const daysAgo = (days: number, h = 0) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000 - h * 60 * 60 * 1000);

const make = (
  partial: Partial<ScoreRecord> & { playerId: string; timeMs: number },
): ScoreRecord => ({
  name: 'P',
  misses: 0,
  playedAt: daysAgo(0),
  ...partial,
});

describe('compareScore', () => {
  it('orders by timeMs ascending first', () => {
    const a = make({ playerId: 'a', timeMs: 10000 });
    const b = make({ playerId: 'b', timeMs: 12000 });
    expect(compareScore(a, b)).toBeLessThan(0);
    expect(compareScore(b, a)).toBeGreaterThan(0);
  });

  it('breaks tie by misses ascending', () => {
    const a = make({ playerId: 'a', timeMs: 10000, misses: 1 });
    const b = make({ playerId: 'b', timeMs: 10000, misses: 0 });
    expect(compareScore(a, b)).toBeGreaterThan(0);
    expect(compareScore(b, a)).toBeLessThan(0);
  });

  it('breaks further tie by playedAt ascending (earlier wins)', () => {
    const a = make({ playerId: 'a', timeMs: 10000, misses: 0, playedAt: daysAgo(1) });
    const b = make({ playerId: 'b', timeMs: 10000, misses: 0, playedAt: daysAgo(0) });
    expect(compareScore(a, b)).toBeLessThan(0);
    expect(compareScore(b, a)).toBeGreaterThan(0);
  });

  it('returns 0 when fully equal', () => {
    const same = daysAgo(1);
    const a = make({ playerId: 'a', timeMs: 10000, misses: 0, playedAt: same });
    const b = make({ playerId: 'b', timeMs: 10000, misses: 0, playedAt: same });
    expect(compareScore(a, b)).toBe(0);
  });
});

describe('filterRecentScores', () => {
  it('keeps scores within 7 days', () => {
    const inWindow = make({ playerId: 'a', timeMs: 10000, playedAt: daysAgo(6, 23) });
    const out = filterRecentScores([inWindow], NOW);
    expect(out).toEqual([inWindow]);
  });

  it('drops scores older than 7 days', () => {
    const stale = make({ playerId: 'a', timeMs: 10000, playedAt: daysAgo(7, 1) });
    expect(filterRecentScores([stale], NOW)).toEqual([]);
  });

  it('boundary: exactly 7 days ago is dropped (strict greater than)', () => {
    const exactly7 = make({ playerId: 'a', timeMs: 10000, playedAt: daysAgo(7) });
    expect(filterRecentScores([exactly7], NOW)).toEqual([]);
  });

  it('boundary: 1 ms inside the window is kept', () => {
    const justIn = make({
      playerId: 'a',
      timeMs: 10000,
      playedAt: new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000 + 1),
    });
    expect(filterRecentScores([justIn], NOW)).toEqual([justIn]);
  });
});

describe('aggregateBestPerPlayer', () => {
  it('keeps only the best score per playerId', () => {
    const a1 = make({ playerId: 'a', timeMs: 12000 });
    const a2 = make({ playerId: 'a', timeMs: 10000 });
    const b1 = make({ playerId: 'b', timeMs: 11000 });
    const result = aggregateBestPerPlayer([a1, a2, b1]);
    expect(result).toHaveLength(2);
    expect(result.find((s) => s.playerId === 'a')?.timeMs).toBe(10000);
    expect(result.find((s) => s.playerId === 'b')?.timeMs).toBe(11000);
  });

  it('uses full compare order when picking best (miss tiebreak)', () => {
    const slow = make({ playerId: 'a', timeMs: 10000, misses: 5 });
    const fast = make({ playerId: 'a', timeMs: 10000, misses: 0 });
    const result = aggregateBestPerPlayer([slow, fast]);
    expect(result).toHaveLength(1);
    expect(result[0].misses).toBe(0);
  });

  it('returns empty array for empty input', () => {
    expect(aggregateBestPerPlayer([])).toEqual([]);
  });
});

describe('buildRanking', () => {
  it('filters by 7-day window, aggregates best per player, sorts, and assigns ranks', () => {
    const scores: ScoreRecord[] = [
      make({ playerId: 'a', name: 'Alice', timeMs: 12000, playedAt: daysAgo(1) }),
      make({ playerId: 'a', name: 'Alice', timeMs: 10000, playedAt: daysAgo(0) }),
      make({ playerId: 'b', name: 'Bob', timeMs: 11000, playedAt: daysAgo(2) }),
      make({ playerId: 'c', name: 'Cleo', timeMs: 9000, playedAt: daysAgo(8) }),
    ];
    const ranking = buildRanking(scores, NOW);
    expect(ranking.map((r) => r.playerId)).toEqual(['a', 'b']);
    expect(ranking[0].rank).toBe(1);
    expect(ranking[0].timeMs).toBe(10000);
    expect(ranking[1].rank).toBe(2);
    expect(ranking[1].timeMs).toBe(11000);
  });

  it('returns at most TOP-N entries (default 10)', () => {
    const scores: ScoreRecord[] = Array.from({ length: 15 }, (_, i) =>
      make({ playerId: `p${i}`, timeMs: 10000 + i, playedAt: daysAgo(0) }),
    );
    const ranking = buildRanking(scores, NOW);
    expect(ranking).toHaveLength(10);
    expect(ranking[0].playerId).toBe('p0');
    expect(ranking[9].playerId).toBe('p9');
  });

  it('honors custom topN', () => {
    const scores: ScoreRecord[] = Array.from({ length: 5 }, (_, i) =>
      make({ playerId: `p${i}`, timeMs: 10000 + i }),
    );
    expect(buildRanking(scores, NOW, 3)).toHaveLength(3);
  });

  it('returns empty array if no scores in window', () => {
    const stale = make({ playerId: 'a', timeMs: 10000, playedAt: daysAgo(10) });
    expect(buildRanking([stale], NOW)).toEqual([]);
  });
});
