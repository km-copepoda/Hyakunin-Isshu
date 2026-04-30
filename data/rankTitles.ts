export type RankTitle = {
  name: string;
};

export const RANK_TITLES: RankTitle[] = [
  { name: '天皇' },
  { name: '上皇' },
  { name: '親王' },
  { name: '摂関' },
  { name: '太政大臣' },
  { name: '左大臣' },
  { name: '右大臣' },
  { name: '大納言' },
  { name: '中納言' },
  { name: '参議' },
];

export function getRankTitle(rank: number): RankTitle | null {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_TITLES.length) return null;
  return RANK_TITLES[rank - 1];
}
