const hasKanji = (text: string) => /[一-鿿㐀-䶿]/.test(text);

export function RubyText({ text, reading }: { text: string; reading: string }) {
  if (!hasKanji(text)) return <>{text}</>;
  return (
    <ruby>
      {text}
      <rt className="text-xs tracking-wider">{reading}</rt>
    </ruby>
  );
}
