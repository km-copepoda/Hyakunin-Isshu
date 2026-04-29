'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { poems } from '@/data/poems';
import { readings } from '@/data/readings';
import { generateOptions } from '@/lib/gameUtils';
import { RubyText } from '@/components/RubyText';
import { useGameSounds } from '@/lib/useGameSounds';
import ScoreSubmit from '@/components/ScoreSubmit';

type Phase = 'stage-select' | 'order-select' | 'playing' | 'poem-complete' | 'stage-clear' | 'game-clear';
type OrderMode = 'sequential' | 'reverse' | 'random';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSecs = Math.floor(totalTenths / 10);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  if (mins > 0) {
    return `${mins}分${String(secs).padStart(2, '0')}.${tenths}秒`;
  }
  return `${secs}.${tenths}秒`;
}

export default function GameScreen() {
  const [poemIdx, setPoemIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [filled, setFilled] = useState<(string | null)[]>([null, null, null, null, null]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('stage-select');
  const [showNext, setShowNext] = useState(false);
  const [selectedStage, setSelectedStage] = useState(1);
  const [poemOrder, setPoemOrder] = useState<number[]>(() => Array.from({ length: 10 }, (_, i) => i));
  const [positionInStage, setPositionInStage] = useState(0);
  const [currentOrderMode, setCurrentOrderMode] = useState<OrderMode>('sequential');

  // Timer state (display only — actual timing uses refs)
  const [displayMs, setDisplayMs] = useState(0);
  const [finalStageMs, setFinalStageMs] = useState(0);
  const [showPenalty, setShowPenalty] = useState(false);

  // Mistake tracking
  const [stageMistakes, setStageMistakes] = useState(0);
  const [finalStageMistakes, setFinalStageMistakes] = useState(0);

  // Timer refs
  const poemStartRef = useRef<number>(0);
  const penaltyRef = useRef<number>(0);
  const stageBaseRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const penaltyFlashRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const poem = poems[poemIdx] ?? poems[99];
  const stageNum = selectedStage;
  const poemInStage = positionInStage + 1;

  const { playCorrect, playWrong } = useGameSounds();

  const segmentToReading = useMemo(() => {
    const map = new Map<string, string>();
    readings.forEach((poemReadings, i) => {
      poems[i].segments.forEach((seg, j) => {
        if (!map.has(seg)) map.set(seg, poemReadings[j]);
      });
    });
    return map;
  }, []);

  useEffect(() => {
    if (phase === 'playing') {
      setOptions(generateOptions(poems, poemIdx, step));
    }
  }, [poemIdx, step, phase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (penaltyFlashRef.current) clearTimeout(penaltyFlashRef.current);
    };
  }, []);

  const stopTimer = useCallback((): number => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stageBaseRef.current += penaltyRef.current + (Date.now() - poemStartRef.current);
    setDisplayMs(stageBaseRef.current);
    return stageBaseRef.current;
  }, []);

  const startTimerForPoem = useCallback((isNewStage: boolean) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isNewStage) {
      stageBaseRef.current = 0;
      setFinalStageMs(0);
      setDisplayMs(0);
    }
    poemStartRef.current = Date.now();
    penaltyRef.current = 0;
    intervalRef.current = setInterval(() => {
      setDisplayMs(
        stageBaseRef.current + penaltyRef.current + (Date.now() - poemStartRef.current),
      );
    }, 100);
  }, []);

  const startPoem = useCallback(
    (idx: number, pos: number, isNewStage: boolean) => {
      setPoemIdx(idx);
      setPositionInStage(pos);
      setStep(0);
      setFilled([null, null, null, null, null]);
      setWrong([]);
      setPhase('playing');
      setShowNext(false);
      if (isNewStage) setStageMistakes(0);
      startTimerForPoem(isNewStage);
    },
    [startTimerForPoem],
  );

  const handleSelectStage = useCallback((stage: number) => {
    setSelectedStage(stage);
    setPhase('order-select');
  }, []);

  const handleSelectOrder = useCallback(
    (mode: OrderMode) => {
      const base = (selectedStage - 1) * 10;
      const indices = Array.from({ length: 10 }, (_, i) => base + i);
      const order =
        mode === 'sequential' ? indices
        : mode === 'reverse' ? [...indices].reverse()
        : shuffle(indices);
      setPoemOrder(order);
      setCurrentOrderMode(mode);
      startPoem(order[0], 0, true);
    },
    [selectedStage, startPoem],
  );

  const handleChoice = useCallback(
    (choice: string) => {
      if (phase !== 'playing') return;
      const correct = poem.segments[step];

      if (choice === correct) {
        playCorrect();
        const newFilled = [...filled];
        newFilled[step] = choice;
        setFilled(newFilled);
        setWrong([]);

        if (step === 4) {
          const total = stopTimer();
          setFinalStageMs(total);
          setPhase('poem-complete');
          setTimeout(() => setShowNext(true), 2200);
        } else {
          setStep((s) => s + 1);
        }
      } else {
        // Wrong: add 1-second penalty
        playWrong();
        penaltyRef.current += 1000;
        setStageMistakes((prev) => prev + 1);
        setWrong((prev) => (prev.includes(choice) ? prev : [...prev, choice]));
        if (penaltyFlashRef.current) clearTimeout(penaltyFlashRef.current);
        setShowPenalty(true);
        penaltyFlashRef.current = setTimeout(() => setShowPenalty(false), 800);
      }
    },
    [phase, poem, step, filled, stopTimer],
  );

  const handleNextPoem = useCallback(() => {
    const nextPos = positionInStage + 1;
    if (nextPos >= poemOrder.length) {
      setFinalStageMistakes(stageMistakes);
      if (selectedStage >= 10) {
        setPhase('game-clear');
      } else {
        setPhase('stage-clear');
      }
      return;
    }
    startPoem(poemOrder[nextPos], nextPos, false);
  }, [positionInStage, poemOrder, selectedStage, startPoem, stageMistakes]);

  const handleNextStage = useCallback(() => {
    const nextStage = selectedStage + 1;
    setSelectedStage(nextStage);
    setPhase('order-select');
  }, [selectedStage]);

  const handleBackToSelect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPhase('stage-select');
  }, []);

  const isComplete = phase !== 'playing';

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-start px-4 py-8">

      {/* ===== STAGE SELECT ===== */}
      {phase === 'stage-select' && (
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-amber-400 text-4xl font-serif tracking-widest mb-2">百人一首</h1>
            <p className="text-stone-400 text-sm">ステージを選んでください</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 10 }, (_, i) => {
              const sNum = i + 1;
              const first = i * 10 + 1;
              const last = first + 9;
              return (
                <div
                  key={sNum}
                  className="rounded-lg border-2 border-stone-600 bg-stone-800 hover:border-amber-500 transition-all duration-200 overflow-hidden flex flex-col"
                >
                  <button
                    onClick={() => handleSelectStage(sNum)}
                    className="px-4 pt-5 pb-3 text-center hover:bg-stone-700 active:scale-95 transition-all"
                  >
                    <div className="text-amber-300 font-serif text-xl mb-1">第 {sNum} 章</div>
                    <div className="text-stone-400 text-xs">第 {first} 〜 {last} 首</div>
                  </button>
                  <Link
                    href={`/ranking/${sNum}`}
                    className="text-center px-3 py-1.5 text-stone-500 hover:text-amber-300 hover:bg-stone-700/60 text-xs border-t border-stone-700 transition-colors"
                  >
                    📊 ランキング
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ORDER SELECT ===== */}
      {phase === 'order-select' && (
        <div className="w-full max-w-md flex flex-col items-center gap-6 mt-8">
          <div className="text-center">
            <div className="text-amber-400 text-3xl font-serif tracking-widest mb-1">第 {selectedStage} 章</div>
            <div className="text-stone-400 text-sm">出題順を選んでください</div>
          </div>
          <div className="w-full flex flex-col gap-3">
            {(
              [
                { mode: 'sequential' as OrderMode, label: '順順', sub: '第1首 → 第10首', icon: '→' },
                { mode: 'reverse' as OrderMode, label: '逆順', sub: '第10首 → 第1首', icon: '←' },
                { mode: 'random' as OrderMode, label: 'ランダム', sub: 'シャッフル', icon: '✦' },
              ] as const
            ).map(({ mode, label, sub, icon }) => (
              <button
                key={mode}
                onClick={() => handleSelectOrder(mode)}
                className="rounded-xl border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-amber-500 px-6 py-5 flex items-center gap-4 transition-all duration-200 active:scale-95"
              >
                <span className="text-amber-400 text-2xl w-8 text-center">{icon}</span>
                <div className="text-left">
                  <div className="text-amber-200 font-serif text-lg">{label}</div>
                  <div className="text-stone-500 text-xs">{sub}</div>
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={handleBackToSelect}
            className="text-stone-500 hover:text-amber-300 text-sm transition-colors"
          >
            ← ステージ選択に戻る
          </button>
        </div>
      )}

      {/* ===== STAGE CLEAR ===== */}
      {phase === 'stage-clear' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-float-up mt-16">
          <div className="text-amber-400 text-5xl font-serif tracking-widest">第{stageNum}章</div>
          <div className="text-white text-3xl">クリア！</div>
          <div className="bg-stone-800 border border-amber-700 rounded-xl px-10 py-6 text-center min-w-[220px]">
            <div className="text-stone-400 text-xs mb-2 tracking-widest">タイム</div>
            <div className="text-amber-300 text-4xl font-mono">{formatTime(finalStageMs)}</div>
            <div className={`mt-4 text-sm font-semibold ${finalStageMistakes === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalStageMistakes === 0 ? 'ノーミス！' : `ミス ${finalStageMistakes} 回`}
            </div>
          </div>
          {finalStageMistakes === 0 && (
            <div className="bg-emerald-900/40 border border-emerald-600 rounded-xl px-8 py-4 text-center animate-float-up">
              <div className="text-emerald-300 text-xs mb-1 tracking-widest">ノーミスタイム</div>
              <div className="text-emerald-200 text-3xl font-mono">{formatTime(finalStageMs)}</div>
            </div>
          )}
          <ScoreSubmit
            chapter={stageNum}
            orderMode={currentOrderMode}
            timeMs={finalStageMs}
            misses={finalStageMistakes}
          />
          <button
            onClick={handleNextStage}
            className="mt-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg text-lg font-semibold transition-colors"
          >
            次の章へ →
          </button>
          <button
            onClick={handleBackToSelect}
            className="px-8 py-2 text-stone-400 hover:text-amber-300 text-sm transition-colors"
          >
            ステージ選択に戻る
          </button>
        </div>
      )}

      {/* ===== GAME CLEAR ===== */}
      {phase === 'game-clear' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-float-up mt-16">
          <div className="text-amber-400 text-5xl font-serif tracking-widest">百人一首</div>
          <div className="text-white text-3xl">完全制覇！</div>
          <div className="bg-stone-800 border border-amber-700 rounded-xl px-10 py-6 text-center min-w-[220px]">
            <div className="text-stone-400 text-xs mb-2 tracking-widest">最終ステージ タイム</div>
            <div className="text-amber-300 text-4xl font-mono">{formatTime(finalStageMs)}</div>
            <div className={`mt-4 text-sm font-semibold ${finalStageMistakes === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalStageMistakes === 0 ? 'ノーミス！' : `ミス ${finalStageMistakes} 回`}
            </div>
          </div>
          {finalStageMistakes === 0 && (
            <div className="bg-emerald-900/40 border border-emerald-600 rounded-xl px-8 py-4 text-center animate-float-up">
              <div className="text-emerald-300 text-xs mb-1 tracking-widest">ノーミスタイム</div>
              <div className="text-emerald-200 text-3xl font-mono">{formatTime(finalStageMs)}</div>
            </div>
          )}
          <ScoreSubmit
            chapter={stageNum}
            orderMode={currentOrderMode}
            timeMs={finalStageMs}
            misses={finalStageMistakes}
          />
          <div className="text-stone-300 text-base text-center leading-relaxed max-w-xs">
            百首すべての和歌を完成させました。
            <br />おめでとうございます！
          </div>
          <button
            onClick={handleBackToSelect}
            className="mt-2 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-lg font-semibold transition-colors"
          >
            ステージ選択に戻る
          </button>
        </div>
      )}

      {/* ===== PLAYING / POEM-COMPLETE ===== */}
      {phase !== 'stage-select' && phase !== 'order-select' && phase !== 'stage-clear' && phase !== 'game-clear' && (
        <>
          {/* Header */}
          <div className="w-full max-w-md mb-4 text-center">
            <div className="text-stone-400 text-xs mb-1 tracking-widest uppercase">
              第{stageNum}章 &nbsp;·&nbsp; {poemInStage} / 10
            </div>
            <div className="text-amber-300 text-2xl font-serif">{poem.author}</div>
            <div className="text-stone-500 text-xs mt-1">第 {poem.id} 首</div>
            {/* Timer */}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="text-stone-300 font-mono text-lg">{formatTime(displayMs)}</span>
              {showPenalty && (
                <span className="text-rose-400 text-sm font-bold animate-pulse">+1秒</span>
              )}
            </div>
          </div>

          {/* Tanzaku Slots */}
          <div className="w-full max-w-md flex flex-col gap-2 mb-6">
            {([0, 1, 2, 3, 4] as const).map((slotIdx) => {
              const text = filled[slotIdx];
              const isFilled = text !== null;
              const isActive = phase === 'playing' && slotIdx === step;

              return (
                <div
                  key={slotIdx}
                  className={[
                    'tanzaku rounded-lg border-2 px-5 py-3 text-center font-serif text-xl transition-all duration-500',
                    isFilled
                      ? isComplete
                        ? 'bg-amber-100 border-amber-300 text-stone-800 animate-glow-pulse'
                        : 'bg-amber-50 border-amber-300 text-stone-800 animate-fill-in'
                      : isActive
                        ? 'bg-stone-800 border-amber-500 border-dashed text-stone-500'
                        : 'bg-stone-800/60 border-stone-700 text-stone-700',
                  ].join(' ')}
                >
                  {isFilled ? (
                    <RubyText text={text} reading={readings[poemIdx][slotIdx]} />
                  ) : (
                    '　　　　　'
                  )}
                </div>
              );
            })}
          </div>

          {/* Choice Buttons */}
          {phase === 'playing' && (
            <div className="w-full max-w-md grid grid-cols-2 gap-3">
              {options.map((opt, i) => {
                const isWrong = wrong.includes(opt);
                const reading = segmentToReading.get(opt) ?? opt;
                return (
                  <button
                    key={`${poemIdx}-${step}-${i}`}
                    onClick={() => handleChoice(opt)}
                    disabled={isWrong}
                    className={[
                      'rounded-lg border px-3 py-4 font-serif text-base leading-snug transition-all duration-200',
                      isWrong
                        ? 'bg-stone-800 border-stone-700 text-stone-600 cursor-not-allowed line-through'
                        : 'bg-stone-700 border-stone-600 text-white hover:bg-stone-600 hover:border-amber-500 active:scale-95',
                    ].join(' ')}
                  >
                    {isWrong && <span className="mr-1 text-rose-500">✗</span>}
                    <RubyText text={opt} reading={reading} />
                  </button>
                );
              })}
            </div>
          )}

          {/* Poem Complete View */}
          {phase === 'poem-complete' && (
            <div className="w-full max-w-md animate-float-up">
              <div className="text-center mb-4">
                <p className="text-amber-200 font-serif text-lg leading-relaxed tracking-wide">
                  {poem.segments.map((seg, i) => (
                    <span key={i}>
                      {i > 0 && '　'}
                      <RubyText text={seg} reading={readings[poemIdx][i]} />
                    </span>
                  ))}
                </p>
              </div>
              <div className="bg-stone-800 border border-stone-700 rounded-lg p-4 mb-6">
                <div className="text-stone-400 text-xs mb-2 tracking-wider">現代語訳</div>
                <p className="text-stone-200 text-sm leading-relaxed">{poem.translation}</p>
              </div>
              {showNext && (
                <button
                  onClick={handleNextPoem}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg text-lg font-semibold transition-colors animate-float-up"
                >
                  {selectedStage >= 10 && positionInStage >= 9
                    ? '完全制覇！'
                    : positionInStage >= 9
                      ? '次の章へ →'
                      : '次の歌へ →'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
