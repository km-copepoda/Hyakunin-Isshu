import { describe, it, expect } from 'vitest';
import { authorReadings } from '@/data/authorReadings';
import { poems } from '@/data/poems';

describe('authorReadings', () => {
  it('has the same length as poems (100)', () => {
    expect(authorReadings).toHaveLength(100);
    expect(authorReadings.length).toBe(poems.length);
  });

  it('all entries are non-empty', () => {
    for (const r of authorReadings) {
      expect(r.length).toBeGreaterThan(0);
    }
  });

  it('1番 = てんじてんのう', () => {
    expect(authorReadings[0]).toBe('てんじてんのう');
  });

  it('100番 = じゅんとくいん', () => {
    expect(authorReadings[99]).toBe('じゅんとくいん');
  });

  it('all entries are hiragana (no kanji/katakana)', () => {
    const hiraganaOnly = /^[぀-ゟ]+$/;
    for (const r of authorReadings) {
      expect(r).toMatch(hiraganaOnly);
    }
  });
});
