'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getOrCreatePlayerId,
  getStoredName,
  setStoredName,
} from '@/lib/playerId';
import { MAX_NAME_LENGTH } from '@/lib/validation';

type OrderMode = 'sequential' | 'reverse' | 'random';
type Status = 'idle' | 'submitting' | 'submitted' | 'error';

export default function ScoreSubmit({
  chapter,
  orderMode,
  timeMs,
  misses,
}: {
  chapter: number;
  orderMode: OrderMode;
  timeMs: number;
  misses: number;
}) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredName();
    setName(stored);
    setEditing(stored.length === 0);
  }, []);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_NAME_LENGTH) {
      setError(`名前は1〜${MAX_NAME_LENGTH}文字で入力してください`);
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: getOrCreatePlayerId(),
          name: trimmed,
          chapter,
          orderMode,
          timeMs,
          misses,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `status ${res.status}`);
      }
      setStoredName(trimmed);
      setName(trimmed);
      setEditing(false);
      setStatus('submitted');
    } catch (e) {
      setError(e instanceof Error ? e.message : '送信に失敗しました');
      setStatus('error');
    }
  };

  if (status === 'submitted') {
    return (
      <div className="w-full max-w-xs flex flex-col items-center gap-3 mt-2">
        <div className="text-emerald-300 text-sm">名乗りを上げました！</div>
        <Link
          href={`/ranking/${chapter}`}
          className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-amber-200 rounded-lg text-sm transition-colors"
        >
          名うての歌詠みを見る →
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xs flex flex-col items-center gap-2 mt-2">
      {editing ? (
        <>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="名前（最大16文字）"
            maxLength={MAX_NAME_LENGTH}
            className="w-full px-3 py-2 bg-stone-800 border border-stone-600 rounded-lg text-amber-100 text-center placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={submit}
            disabled={status === 'submitting' || name.trim().length === 0}
            className="w-full px-6 py-2 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 disabled:bg-stone-700 disabled:text-stone-500 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {status === 'submitting' ? '送信中...' : '名乗りを上げる'}
          </button>
        </>
      ) : (
        <>
          <button
            onClick={submit}
            disabled={status === 'submitting'}
            className="w-full px-6 py-2 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 disabled:bg-stone-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            {status === 'submitting' ? '送信中...' : `${name} で名乗りを上げる`}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="text-stone-500 hover:text-amber-300 text-xs transition-colors"
          >
            名前を変える
          </button>
        </>
      )}
      {error && <div className="text-rose-400 text-xs">{error}</div>}
    </div>
  );
}
