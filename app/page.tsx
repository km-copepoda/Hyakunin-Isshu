import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-10">
          <h1 className="text-amber-400 text-5xl font-serif tracking-widest mb-3">百人一首</h1>
          <p className="text-stone-400 text-sm">遊び方を選んでください</p>
        </div>

        <div className="w-full flex flex-col gap-4">
          <Link
            href="/play/segments"
            className="rounded-xl border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-amber-500 px-6 py-5 transition-all duration-200 active:scale-95"
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-amber-400 text-2xl">⛩</span>
              <div className="text-amber-200 font-serif text-xl">句当て</div>
            </div>
            <div className="text-stone-500 text-xs leading-relaxed pl-9">
              作者と上の句から、残りの句を当てるモード
            </div>
          </Link>

          <Link
            href="/play/author"
            className="rounded-xl border-2 border-stone-600 bg-stone-800 hover:bg-stone-700 hover:border-amber-500 px-6 py-5 transition-all duration-200 active:scale-95"
          >
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-amber-400 text-2xl">✒</span>
              <div className="text-amber-200 font-serif text-xl">歌人当て</div>
            </div>
            <div className="text-stone-500 text-xs leading-relaxed pl-9">
              和歌の全文から、作者を当てるモード
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
