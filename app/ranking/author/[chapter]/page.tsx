import { notFound } from 'next/navigation';
import RankingView from '@/components/RankingView';

export default function AuthorRankingPage({ params }: { params: { chapter: string } }) {
  const chapter = Number(params.chapter);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 10) {
    notFound();
  }
  return <RankingView chapter={chapter} gameMode="author" />;
}
