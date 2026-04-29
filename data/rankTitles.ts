export type RankTitle = {
  name: string;
  description: string;
};

export const RANK_TITLES: RankTitle[] = [
  { name: '天智天皇', description: '1番歌の作者。百人一首の頂点にして始まり。' },
  { name: '京極中納言', description: '選者・藤原定家。この世界を創り上げた支配者。' },
  { name: '柿本人麿', description: '「歌聖」と仰がれる伝説。圧倒的なカリスマ。' },
  { name: '小野小町', description: '六歌仙の一人。華やかさと実力を兼ね備えた象徴。' },
  { name: '在原業平', description: '情熱的で華麗な打ち手。美しき強者。' },
  { name: '紫式部', description: '知性の頂点。物語を紡ぐような緻密な実力者。' },
  { name: '清少納言', description: '鋭い機知と瞬発力。スピード勝負の達人。' },
  { name: '崇徳院', description: '激しさと情念。「瀬を早み…」の如き勢い。' },
  { name: '西行法師', description: 'ストイックに道を極めた、孤高の熟練者。' },
  { name: '和泉式部', description: '天性のセンス。人を惹きつける華ある中堅。' },
  { name: '大納言公任', description: '歌のルールを定めた秀才。理論派の打ち手。' },
  { name: '参議篁', description: '文武両道の異才。独特のスタイルを持つ実力者。' },
  { name: '赤染衛門', description: '安定感抜群のベテラン。堅実なプレイスタイル。' },
  { name: '紀貫之', description: '三代集の編纂者。基礎がしっかりした中堅。' },
  { name: '蝉丸', description: '逢坂の関の主。ミステリアスな実力派。' },
  { name: '伊勢大輔', description: '期待の逸材。宮廷に現れた新風。' },
  { name: '小式部内侍', description: '親譲りの才能。「大江山…」の如き機転の持ち主。' },
  { name: '曾禰好忠', description: '独創的な歌風。型にはまらない面白さ。' },
  { name: '式子内親王', description: '秘めたる情熱を持つ、修行中の身。' },
  { name: '壬生忠岑', description: '初々しくも確かな足取り。伝説への第一歩。' },
];

export function getRankTitle(rank: number): RankTitle | null {
  if (!Number.isInteger(rank) || rank < 1 || rank > RANK_TITLES.length) return null;
  return RANK_TITLES[rank - 1];
}
