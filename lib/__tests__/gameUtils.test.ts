import { describe, it, expect } from 'vitest';
import { poems } from '@/data/poems';
import { readings } from '@/data/readings';
import {
  generateOptions,
  rankCandidatesByReading,
  DEFAULT_OPTION_POOL_SIZE,
} from '@/lib/gameUtils';
import { similarityScore } from '@/lib/similarity';

describe('rankCandidatesByReading', () => {
  it('sorts candidates by descending similarity to the correct reading', () => {
    const ranked = rankCandidatesByReading(poems, readings, 0, 0);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('does not include the correct segment', () => {
    const correct = poems[0].segments[0];
    const ranked = rankCandidatesByReading(poems, readings, 0, 0);
    expect(ranked.find((c) => c.segment === correct)).toBeUndefined();
  });

  it('deduplicates candidates that share the same segment text', () => {
    // 「白妙の」は 2,4,6 番歌の第3セグメントに登場する
    const ranked = rankCandidatesByReading(poems, readings, 0, 2);
    const segs = ranked.map((c) => c.segment);
    expect(new Set(segs).size).toBe(segs.length);
  });

  it('top candidate shares a prefix kana with the correct reading when one exists', () => {
    // poems[0] step 0 = 「秋の田の」 / reading 「あきのたの」
    // 候補に「あ」始まりは複数あるはずなので、トップは少なくとも先頭1文字共有を持つ
    const ranked = rankCandidatesByReading(poems, readings, 0, 0);
    const top = ranked[0];
    expect(top.reading[0]).toBe('あ');
  });
});

describe('generateOptions', () => {
  it('returns exactly 4 options', () => {
    const opts = generateOptions(poems, readings, 0, 0);
    expect(opts).toHaveLength(4);
  });

  it('includes the correct segment', () => {
    const correct = poems[0].segments[0];
    const opts = generateOptions(poems, readings, 0, 0);
    expect(opts).toContain(correct);
  });

  it('returns 4 unique options', () => {
    const opts = generateOptions(poems, readings, 0, 0);
    expect(new Set(opts).size).toBe(4);
  });

  it('all 3 wrong options come from the top similarity pool', () => {
    const correct = poems[0].segments[0];
    const ranked = rankCandidatesByReading(poems, readings, 0, 0);
    const poolSegments = new Set(
      ranked.slice(0, DEFAULT_OPTION_POOL_SIZE).map((c) => c.segment),
    );

    // 30回試行して、毎回 wrong 候補が pool に収まることを確認
    for (let trial = 0; trial < 30; trial++) {
      const opts = generateOptions(poems, readings, 0, 0);
      const wrongs = opts.filter((o) => o !== correct);
      for (const w of wrongs) {
        expect(poolSegments.has(w)).toBe(true);
      }
    }
  });

  it('wrong options are on average more similar than uniform random selection', () => {
    // poems[0] step 0 「あきのたの」を相手に、similarity-based で抽出される
    // 誤答の平均 similarity が、全候補平均より高いことを統計的に確認する
    const correct = poems[0].segments[0];
    const correctReading = readings[0][0];

    // 全候補の平均スコア（重複除去）
    const seen = new Set<string>();
    const allCandidateScores: number[] = [];
    for (let i = 1; i < poems.length; i++) {
      const seg = poems[i].segments[0];
      if (seg === correct || seen.has(seg)) continue;
      seen.add(seg);
      allCandidateScores.push(similarityScore(correctReading, readings[i][0]));
    }
    const allAvg =
      allCandidateScores.reduce((a, b) => a + b, 0) / allCandidateScores.length;

    // 試行から得た誤答の平均スコア
    const trials = 50;
    let total = 0;
    let count = 0;
    for (let t = 0; t < trials; t++) {
      const opts = generateOptions(poems, readings, 0, 0);
      for (const o of opts) {
        if (o === correct) continue;
        // 対応する reading を逆引き
        let r: string | undefined;
        for (let i = 0; i < poems.length; i++) {
          if (poems[i].segments[0] === o) {
            r = readings[i][0];
            break;
          }
        }
        if (r) {
          total += similarityScore(correctReading, r);
          count++;
        }
      }
    }
    const sampledAvg = total / count;
    expect(sampledAvg).toBeGreaterThan(allAvg);
  });

  it('works for every poem and every step', () => {
    for (let i = 0; i < poems.length; i++) {
      for (let s = 0; s < 5; s++) {
        const opts = generateOptions(poems, readings, i, s);
        expect(opts).toHaveLength(4);
        expect(opts).toContain(poems[i].segments[s]);
        expect(new Set(opts).size).toBe(4);
      }
    }
  });
});
