import { describe, it, expect } from 'vitest';
import { poems } from '@/data/poems';
import { authorReadings } from '@/data/authorReadings';
import {
  generateAuthorOptions,
  rankAuthorCandidatesByReading,
  DEFAULT_AUTHOR_OPTION_POOL_SIZE,
} from '@/lib/gameUtils';
import { similarityScore } from '@/lib/similarity';

describe('rankAuthorCandidatesByReading', () => {
  it('sorts authors by descending similarity to the correct author reading', () => {
    const ranked = rankAuthorCandidatesByReading(poems, authorReadings, 0);
    for (let i = 1; i < ranked.length; i++) {
      expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
    }
  });

  it('does not include the correct author', () => {
    const correct = poems[0].author;
    const ranked = rankAuthorCandidatesByReading(poems, authorReadings, 0);
    expect(ranked.find((c) => c.author === correct)).toBeUndefined();
  });

  it('deduplicates authors that share the same name (e.g. same poet across poems)', () => {
    const ranked = rankAuthorCandidatesByReading(poems, authorReadings, 0);
    const names = ranked.map((c) => c.author);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('generateAuthorOptions', () => {
  it('returns exactly 4 options', () => {
    const opts = generateAuthorOptions(poems, authorReadings, 0);
    expect(opts).toHaveLength(4);
  });

  it('includes the correct author', () => {
    const correct = poems[0].author;
    const opts = generateAuthorOptions(poems, authorReadings, 0);
    expect(opts).toContain(correct);
  });

  it('returns 4 unique authors', () => {
    const opts = generateAuthorOptions(poems, authorReadings, 0);
    expect(new Set(opts).size).toBe(4);
  });

  it('all 3 wrong options come from the top similarity pool', () => {
    const correct = poems[0].author;
    const ranked = rankAuthorCandidatesByReading(poems, authorReadings, 0);
    const poolAuthors = new Set(
      ranked.slice(0, DEFAULT_AUTHOR_OPTION_POOL_SIZE).map((c) => c.author),
    );
    for (let trial = 0; trial < 30; trial++) {
      const opts = generateAuthorOptions(poems, authorReadings, 0);
      const wrongs = opts.filter((o) => o !== correct);
      for (const w of wrongs) {
        expect(poolAuthors.has(w)).toBe(true);
      }
    }
  });

  it('wrong authors are on average more similar than uniform random selection', () => {
    const correctAuthor = poems[0].author;
    const correctReading = authorReadings[0];

    const seen = new Set<string>();
    const allScores: number[] = [];
    for (let i = 1; i < poems.length; i++) {
      const a = poems[i].author;
      if (a === correctAuthor || seen.has(a)) continue;
      seen.add(a);
      allScores.push(similarityScore(correctReading, authorReadings[i]));
    }
    const allAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    const trials = 50;
    let total = 0;
    let count = 0;
    const authorToReading = new Map<string, string>();
    for (let i = 0; i < poems.length; i++) {
      if (!authorToReading.has(poems[i].author)) {
        authorToReading.set(poems[i].author, authorReadings[i]);
      }
    }
    for (let t = 0; t < trials; t++) {
      const opts = generateAuthorOptions(poems, authorReadings, 0);
      for (const o of opts) {
        if (o === correctAuthor) continue;
        const r = authorToReading.get(o);
        if (r) {
          total += similarityScore(correctReading, r);
          count++;
        }
      }
    }
    const sampledAvg = total / count;
    expect(sampledAvg).toBeGreaterThan(allAvg);
  });

  it('works for every poem', () => {
    for (let i = 0; i < poems.length; i++) {
      const opts = generateAuthorOptions(poems, authorReadings, i);
      expect(opts).toHaveLength(4);
      expect(opts).toContain(poems[i].author);
      expect(new Set(opts).size).toBe(4);
    }
  });
});
