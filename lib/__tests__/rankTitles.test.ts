import { describe, it, expect } from 'vitest';
import { getRankTitle, RANK_TITLES } from '@/data/rankTitles';

describe('getRankTitle', () => {
  it('returns the 1st place title for rank 1', () => {
    expect(getRankTitle(1)?.name).toBe('天智天皇');
  });

  it('returns the 20th place title for rank 20', () => {
    expect(getRankTitle(20)?.name).toBe('壬生忠岑');
  });

  it('returns null for rank 0 and rank 21+', () => {
    expect(getRankTitle(0)).toBeNull();
    expect(getRankTitle(21)).toBeNull();
    expect(getRankTitle(-1)).toBeNull();
  });

  it('returns null for non-integer rank', () => {
    expect(getRankTitle(1.5)).toBeNull();
  });

  it('has exactly 20 titles defined', () => {
    expect(RANK_TITLES).toHaveLength(20);
  });

  it('all titles have non-empty name and description', () => {
    for (const t of RANK_TITLES) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});
