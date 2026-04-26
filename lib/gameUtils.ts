import { type Poem } from '@/data/poems';

export function generateOptions(
  poems: Poem[],
  poemIdx: number,
  step: number,
): string[] {
  const poem = poems[poemIdx];
  const correct = poem.segments[step];

  // Collect unique wrong-answer candidates from other poems at the same segment position
  const candidates = new Set<string>();
  for (const p of poems) {
    if (p.id !== poem.id) {
      const seg = p.segments[step];
      if (seg !== correct) {
        candidates.add(seg);
      }
    }
  }

  const shuffled = Array.from(candidates).sort(() => Math.random() - 0.5);
  const wrong = shuffled.slice(0, 3);

  return [...wrong, correct].sort(() => Math.random() - 0.5);
}
