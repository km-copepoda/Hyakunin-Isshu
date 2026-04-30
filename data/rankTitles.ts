export type RankTitle = {
  name: string;
};

export const RANK_TITLES: RankTitle[] = [
  { name: '天皇' },
  { name: '摂関' },
  { name: '大臣' },
  { name: '大納言' },
  { name: '中納言' },
  { name: '参議' },
  { name: '殿上人' },
  { name: '公卿' },
  { name: '雲上人' },
  { name: '貴人' },
];

export function getRankTitle(rank: number): RankTitle | null {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_TITLES.length) return null;
  return RANK_TITLES[rank - 1];
}
