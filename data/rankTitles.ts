export type RankTitle = {
  name: string;
};

export const RANK_TITLES: RankTitle[] = [
  { name: '天智天皇' },
  { name: '京極中納言' },
  { name: '柿本人麿' },
  { name: '小野小町' },
  { name: '在原業平' },
  { name: '紫式部' },
  { name: '清少納言' },
  { name: '崇徳院' },
  { name: '西行法師' },
  { name: '和泉式部' },
];

export function getRankTitle(rank: number): RankTitle | null {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_TITLES.length) return null;
  return RANK_TITLES[rank - 1];
}
