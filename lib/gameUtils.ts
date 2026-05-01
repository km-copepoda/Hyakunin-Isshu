import { type Poem } from '@/data/poems';
import { similarityScore } from '@/lib/similarity';

export const DEFAULT_OPTION_POOL_SIZE = 8;

export type SegmentReadings = readonly (readonly [
  string,
  string,
  string,
  string,
  string,
])[];

export interface ScoredCandidate {
  segment: string;
  reading: string;
  score: number;
}

export function rankCandidatesByReading(
  poems: Poem[],
  readings: SegmentReadings,
  poemIdx: number,
  step: number,
): ScoredCandidate[] {
  const correctSegment = poems[poemIdx].segments[step];
  const correctReading = readings[poemIdx][step];

  const seen = new Set<string>();
  const candidates: ScoredCandidate[] = [];
  for (let i = 0; i < poems.length; i++) {
    if (i === poemIdx) continue;
    const segment = poems[i].segments[step];
    if (segment === correctSegment) continue;
    if (seen.has(segment)) continue;
    seen.add(segment);
    const reading = readings[i][step];
    candidates.push({
      segment,
      reading,
      score: similarityScore(correctReading, reading),
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export function generateOptions(
  poems: Poem[],
  readings: SegmentReadings,
  poemIdx: number,
  step: number,
  poolSize: number = DEFAULT_OPTION_POOL_SIZE,
): string[] {
  const correct = poems[poemIdx].segments[step];
  const ranked = rankCandidatesByReading(poems, readings, poemIdx, step);
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const wrong = shuffledPool.slice(0, 3).map((c) => c.segment);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}

export const DEFAULT_AUTHOR_OPTION_POOL_SIZE = 8;

export interface ScoredAuthorCandidate {
  author: string;
  reading: string;
  score: number;
}

export function rankAuthorCandidatesByReading(
  poems: Poem[],
  authorReadings: readonly string[],
  poemIdx: number,
): ScoredAuthorCandidate[] {
  const correctAuthor = poems[poemIdx].author;
  const correctReading = authorReadings[poemIdx];

  const seen = new Set<string>();
  const candidates: ScoredAuthorCandidate[] = [];
  for (let i = 0; i < poems.length; i++) {
    if (i === poemIdx) continue;
    const author = poems[i].author;
    if (author === correctAuthor) continue;
    if (seen.has(author)) continue;
    seen.add(author);
    const reading = authorReadings[i];
    candidates.push({
      author,
      reading,
      score: similarityScore(correctReading, reading),
    });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

export function generateAuthorOptions(
  poems: Poem[],
  authorReadings: readonly string[],
  poemIdx: number,
  poolSize: number = DEFAULT_AUTHOR_OPTION_POOL_SIZE,
): string[] {
  const correct = poems[poemIdx].author;
  const ranked = rankAuthorCandidatesByReading(poems, authorReadings, poemIdx);
  const pool = ranked.slice(0, Math.min(poolSize, ranked.length));
  const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
  const wrong = shuffledPool.slice(0, 3).map((c) => c.author);
  return [...wrong, correct].sort(() => Math.random() - 0.5);
}
