'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { poems } from '@/data/poems';
import { readings } from '@/data/readings';
import { generateOptions } from '@/lib/gameUtils';
import { RubyText } from '@/components/RubyText';

type Phase = 'stage-select' | 'playing' | 'poem-complete' | 'stage-clear' | 'game-clear';

export default function GameScreen() {
  const [poemIdx, setPoemIdx] = useState(0);
  const [step, setStep] = useState(0); // 0-4: selecting segments[0]-[4]
  const [filled, setFilled] = useState<(string | null)[]>([null, null, null, null, null]);
  const [wrong, setWrong] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('stage-select');
  const [showNext, setShowNext] = useState(false);

  const poem = poems[poemIdx] ?? poems[99];
  const stageNum = Math.floor(poemIdx / 10) + 1;
  const poemInStage = (poemIdx % 10) + 1;

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

  const startPoem = useCallback((idx: number) => {
    setPoemIdx(idx);
    setStep(0);
    setFilled([null, null, null, null, null]);
    setWrong([]);
    setPhase('playing');
    setShowNext(false);
  }, []);

  const handleSelectStage = useCallback(
    (selectedStage: number) => {
      startPoem((selectedStage - 1) * 10);
    },
    [startPoem],
  );

  const handleChoice = useCallback(
    (choice: string) => {
      if (phase !== 'playing') return;
      const correct = poem.segments[step];

      if (choice === correct) {
        const newFilled = [...filled];
        newFilled[step] = choice;
        setFilled(newFilled);
        setWrong([]);

        if (step === 4) {
          setPhase('poem-complete');
          setTimeout(() => setShowNext(true), 2200);
        } else {
          setStep((s) => s + 1);
        }
      } else {
        setWrong((prev) => (prev.includes(choice) ? prev : [...prev, choice]));
      }
    },
    [phase, poem, step, filled],
  );

  const handleNextPoem = useCallback(() => {
    const next = poemIdx + 1;
    if (next >= 100) {
      setPhase('game-clear');
      return;
    }
    if (poemIdx % 10 === 9) {
      setPhase('stage-clear');
      return;
    }
    startPoem(next);
  }, [poemIdx, startPoem]);

  const handleNextStage = useCallback(() => {
    startPoem(poemIdx + 1);
  }, [poemIdx, startPoem]);

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
                <button
                  key={sNum}
                  onClick={() => handleSelectStage(sNum)}
                  className="rounded-lg border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-amber-500 px-4 py-5 text-center transition-all duration-200 active:scale-95"
                >
                  <div className="text-amber-300 font-serif text-xl mb-1">第 {sNum} 章</div>
                  <div className="text-stone-400 text-xs">第 {first} 〜 {last} 首</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== STAGE CLEAR ===== */}
      {phase === 'stage-clear' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-8 animate-float-up mt-24">
          <div className="text-amber-400 text-5xl font-serif tracking-widest">
            第{stageNum}章
          </div>
          <div className="text-white text-3xl">クリア！</div>
          <div className="text-stone-400 text-sm">{poemIdx + 1}首目まで完了</div>
          <button
            onClick={handleNextStage}
            className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg text-lg font-semibold transition-colors"
          >
            次の章へ →
          </button>
          <button
            onClick={() => setPhase('stage-select')}
            className="px-8 py-2 text-stone-400 hover:text-amber-300 text-sm transition-colors"
          >
            ステージ選択に戻る
          </button>
        </div>
      )}

      {/* ===== GAME CLEAR ===== */}
      {phase === 'game-clear' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 animate-float-up mt-24">
          <div className="text-amber-400 text-5xl font-serif tracking-widest">百人一首</div>
          <div className="text-white text-3xl">完全制覇！</div>
          <div className="text-stone-300 text-base text-center leading-relaxed max-w-xs">
            百首すべての和歌を完成させました。
            <br />おめでとうございます！
          </div>
          <button
            onClick={() => setPhase('stage-select')}
            className="mt-4 px-8 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-lg font-semibold transition-colors"
          >
            ステージ選択に戻る
          </button>
        </div>
      )}

      {/* ===== PLAYING / POEM-COMPLETE ===== */}
      {phase !== 'stage-select' && phase !== 'stage-clear' && phase !== 'game-clear' && (
        <>
          {/* Header — author name only at start */}
          <div className="w-full max-w-md mb-6 text-center">
            <div className="text-stone-400 text-xs mb-1 tracking-widest uppercase">
              第{stageNum}章 &nbsp;·&nbsp; {poemInStage} / 10
            </div>
            <div className="text-amber-300 text-2xl font-serif">{poem.author}</div>
            <div className="text-stone-500 text-xs mt-1">第 {poem.id} 首</div>
          </div>

          {/* Tanzaku Slots — all 5 start empty */}
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
                  {poemIdx === 99
                    ? '完全制覇！'
                    : poemIdx % 10 === 9
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
