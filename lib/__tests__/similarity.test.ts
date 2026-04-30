import { describe, it, expect } from 'vitest';
import {
  sharedPrefixLength,
  editDistance,
  similarityScore,
} from '@/lib/similarity';

describe('sharedPrefixLength', () => {
  it('returns 0 when prefixes differ', () => {
    expect(sharedPrefixLength('あきのたの', 'ゆふされば')).toBe(0);
  });

  it('counts matching leading characters', () => {
    expect(sharedPrefixLength('あきのたの', 'あきのよの')).toBe(3);
  });

  it('returns full length when one is prefix of the other', () => {
    expect(sharedPrefixLength('あき', 'あきのたの')).toBe(2);
  });

  it('returns 0 for empty input', () => {
    expect(sharedPrefixLength('', 'あきのたの')).toBe(0);
  });
});

describe('editDistance', () => {
  it('is 0 for identical strings', () => {
    expect(editDistance('あきのたの', 'あきのたの')).toBe(0);
  });

  it('counts single-character substitution', () => {
    expect(editDistance('あきのたの', 'あきのよの')).toBe(1);
  });

  it('handles different lengths', () => {
    expect(editDistance('あき', 'あきのたの')).toBe(3);
  });
});

describe('similarityScore', () => {
  it('gives the highest score for identical strings', () => {
    const same = similarityScore('あきのたの', 'あきのたの');
    const close = similarityScore('あきのたの', 'あきのよの');
    expect(same).toBeGreaterThan(close);
  });

  it('rewards shared prefix (kimari-ji) more than tail similarity', () => {
    // 「あきのたの」と先頭3文字一致の「あきのよの」 vs 末尾だけ似た「ふくからに」
    const headMatch = similarityScore('あきのたの', 'あきのよの');
    const tailish = similarityScore('あきのたの', 'ふくからに');
    expect(headMatch).toBeGreaterThan(tailish);
  });

  it('ranks single-prefix matches above unrelated readings', () => {
    const oneCharShared = similarityScore('あきのたの', 'あまのはら');
    const noShared = similarityScore('あきのたの', 'ゆふされば');
    expect(oneCharShared).toBeGreaterThan(noShared);
  });
});
