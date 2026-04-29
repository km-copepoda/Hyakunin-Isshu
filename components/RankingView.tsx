'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatTime } from '@/lib/formatTime';
import { getOrCreatePlayerId } from '@/lib/playerId';

type OrderMode = 'sequential' | 'reverse' | 'random';

type Entry = {
  rank: number;
  playerId: string;
  name: string;
  timeMs: number;
  misses: number;
  playedAt: string;
};

const ORDER_TABS: { mode: OrderMode; label: string }[] = [
  { mode: 'sequential', label: '順順' },
  { mode: 'reverse', label: '逆順' },
  { mode: 'random', label: 'ランダム' },
];

export default function RankingView({ chapter }: { chapter: number }) {
  const [orderMode, setOrderMode] = useState<OrderMode>('sequential');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  useEffect(() => {
    setMyPlayerId(getOrCreatePlayerId());
  }, []);

  useEffect(() => {
    let cancelled = false;
    setEntries(null);
    setError(null);
    fetch(`/api/ranking?chapter=${chapter}&order=${orderMode}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setEntries(data.ranking ?? []);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [chapter, orderMode]);

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
            第 {chapter} 章 ランキング
          </h1>
          <p className="text-stone-500 text-xs mt-2">過去7日間のベストタイム TOP20</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {ORDER_TABS.map(({ mode, label }) => {
            const active = mode === orderMode;
            return (
              <button
                key={mode}
                onClick={() => setOrderMode(mode)}
                className={[
                  'rounded-lg border px-3 py-2 font-serif text-sm transition-all',
                  active
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-stone-800 border-stone-700 text-stone-400 hover:border-amber-500 hover:text-amber-200',
                ].join(' ')}
              >
                {label}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="text-rose-400 text-sm text-center py-8">エラー: {error}</div>
        )}

        {!error && entries === null && (
          <div className="text-stone-500 text-sm text-center py-8">読み込み中...</div>
        )}

        {!error && entries !== null && entries.length === 0 && (
          <div className="text-stone-500 text-sm text-center py-8">
            まだスコアがありません。
            <br />一番乗りを目指そう！
          </div>
        )}

        {!error && entries !== null && entries.length > 0 && (
          <ol className="flex flex-col gap-1.5">
            {entries.map((e) => {
              const isMine = e.playerId === myPlayerId;
              const isTop3 = e.rank <= 3;
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
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-100 text-base truncate">{e.name}</div>
                    <div className="text-stone-500 text-xs">
                      ミス {e.misses} 回
                    </div>
                  </div>
                  <div className="text-amber-200 font-mono text-base">
                    {formatTime(e.timeMs)}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
