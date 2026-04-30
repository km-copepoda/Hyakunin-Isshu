import { describe, it, expect } from 'vitest';
import { getRankTitle, RANK_TITLES } from '@/data/rankTitles';

describe('getRankTitle', () => {
  it('returns the 1st place title for rank 1', () => {
    expect(getRankTitle(1)?.name).toBe('天皇');
  });

  it('returns the 10th place title for rank 10', () => {
    expect(getRankTitle(10)?.name).toBe('貴人');
  });

  it('returns null for rank 0 and rank 11+', () => {
    expect(getRankTitle(0)).toBeNull();
    expect(getRankTitle(11)).toBeNull();
    expect(getRankTitle(-1)).toBeNull();
  });

  it('returns null for non-integer rank', () => {
    expect(getRankTitle(1.5)).toBeNull();
  });

  it('has exactly 10 titles defined', () => {
    expect(RANK_TITLES).toHaveLength(10);
  });

  it('all titles have non-empty name', () => {
    for (const t of RANK_TITLES) {
      expect(t.name.length).toBeGreaterThan(0);
    }
  });
});
