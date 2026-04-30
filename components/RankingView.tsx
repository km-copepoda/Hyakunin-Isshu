'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/formatTime';
import { getOrCreatePlayerId } from '@/lib/playerId';
import { getRankTitle } from '@/data/rankTitles';

type OrderMode = 'sequential' | 'reverse' | 'random';

type Entry = {
  rank: number;
  playerId: string;
  name: string;
  timeMs: number;
  misses: number;
  playedAt: string;
};

type RankingsByOrder = Record<OrderMode, Entry[]>;

const ORDER_LABELS: { mode: OrderMode; label: string; sub: string }[] = [
  { mode: 'sequential', label: '順順', sub: '第1首 → 第10首' },
  { mode: 'reverse', label: '逆順', sub: '第10首 → 第1首' },
  { mode: 'random', label: 'ランダム', sub: 'シャッフル' },
];

export default function RankingView({ chapter }: { chapter: number }) {
  const [rankings, setRankings] = useState<RankingsByOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  useEffect(() => {
    setMyPlayerId(getOrCreatePlayerId());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRankings(null);
    setError(null);
    fetch(`/api/ranking?chapter=${chapter}`, { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRankings(data.rankings ?? null);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [chapter]);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="inline-block text-stone-500 hover:text-amber-300 text-sm transition-colors mb-3"
          >
            ← ステージ選択へ
          </Link>
          <h1 className="text-amber-400 text-3xl font-serif tracking-widest">
            第 {chapter} 章
          </h1>
          <p className="text-amber-200 text-base font-serif mt-1">名うての歌詠み 十選</p>
          <p className="text-stone-500 text-xs mt-2">過去7日間 上位10名</p>
        </div>

        {error && (
          <div className="text-rose-400 text-sm text-center py-8">エラー: {error}</div>
        )}

        {!error && rankings === null && (
          <div className="text-stone-500 text-sm text-center py-8">読み込み中...</div>
        )}

        {!error && rankings !== null && (
          <div className="flex flex-col gap-8">
            {ORDER_LABELS.map(({ mode, label, sub }) => (
              <RankingSection
                key={mode}
                label={label}
                sub={sub}
                entries={rankings[mode] ?? []}
                myPlayerId={myPlayerId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RankingSection({
  label,
  sub,
  entries,
  myPlayerId,
}: {
  label: string;
  sub: string;
  entries: Entry[];
  myPlayerId: string;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3 border-b border-stone-700 pb-2">
        <h2 className="text-amber-300 font-serif text-xl">{label}</h2>
        <span className="text-stone-500 text-xs">{sub}</span>
      </div>
      {entries.length === 0 ? (
        <div className="text-stone-500 text-sm text-center py-4">
          まだスコアがありません。
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {entries.map((e) => {
            const isMine = e.playerId === myPlayerId;
            const isTop3 = e.rank <= 3;
            const title = getRankTitle(e.rank);
            return (
              <li
                key={`${e.playerId}-${e.playedAt}`}
                className={[
                  'flex items-center gap-3 rounded-lg border px-3 py-2.5',
                  isMine
                    ? 'bg-amber-900/40 border-amber-500'
                    : isTop3
                      ? 'bg-stone-800 border-amber-800'
                      : 'bg-stone-800/60 border-stone-700',
                ].join(' ')}
              >
                <div
                  className={[
                    'font-serif text-lg w-9 text-center shrink-0',
                    e.rank === 1
                      ? 'text-amber-300'
                      : e.rank === 2
                        ? 'text-stone-300'
                        : e.rank === 3
                          ? 'text-amber-700'
                          : 'text-stone-500',
                  ].join(' ')}
                >
                  {e.rank}
                </div>
                <div className="flex-1 min-w-0 text-sm leading-tight">
                  <div className="truncate">
                    <span className="text-stone-500">名前：</span>
                    <span className="text-amber-100">{e.name}</span>
                  </div>
                  {title && (
                    <div className="truncate">
                      <span className="text-stone-500">称号：</span>
                      <span className="text-amber-300 font-serif">{title.name}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-stone-500">ミス：</span>
                    <span className="text-stone-300">{e.misses}回</span>
                  </div>
                </div>
                <div className="text-amber-200 font-mono text-base shrink-0">
                  {formatTime(e.timeMs)}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
