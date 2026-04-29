export const ORDER_MODES = ['sequential', 'reverse', 'random'] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const MIN_CHAPTER = 1;
export const MAX_CHAPTER = 10;
export const MIN_VALID_TIME_MS = 10_000;
export const MIN_NAME_LENGTH = 1;
export const MAX_NAME_LENGTH = 16;

export type ValidatedScoreInput = {
  playerId: string;
  name: string;
  chapter: number;
  orderMode: OrderMode;
  timeMs: number;
  misses: number;
};

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isInteger(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}

function isOrderMode(v: unknown): v is OrderMode {
  return typeof v === 'string' && (ORDER_MODES as readonly string[]).includes(v);
}

export function validateScoreInput(input: unknown): ValidationResult<ValidatedScoreInput> {
  if (!isObject(input)) return { ok: false, error: 'input must be an object' };

  const { playerId, name, chapter, orderMode, timeMs, misses } = input;

  if (typeof playerId !== 'string' || !UUID_PATTERN.test(playerId)) {
    return { ok: false, error: 'playerId must be a uuid' };
  }
  if (typeof name !== 'string') {
    return { ok: false, error: 'name must be a string' };
  }
  const trimmedName = name.trim();
  if (trimmedName.length < MIN_NAME_LENGTH || trimmedName.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `name length must be ${MIN_NAME_LENGTH}..${MAX_NAME_LENGTH}` };
  }
  if (!isInteger(chapter) || chapter < MIN_CHAPTER || chapter > MAX_CHAPTER) {
    return { ok: false, error: `chapter must be integer in ${MIN_CHAPTER}..${MAX_CHAPTER}` };
  }
  if (!isOrderMode(orderMode)) {
    return { ok: false, error: 'orderMode must be sequential|reverse|random' };
  }
  if (!isInteger(timeMs) || timeMs < MIN_VALID_TIME_MS) {
    return { ok: false, error: `timeMs must be integer >= ${MIN_VALID_TIME_MS}` };
  }
  if (!isInteger(misses) || misses < 0) {
    return { ok: false, error: 'misses must be a non-negative integer' };
  }

  return {
    ok: true,
    data: {
      playerId,
      name: trimmedName,
      chapter,
      orderMode,
      timeMs,
      misses,
    },
  };
}

export type ValidatedChapterQuery = { chapter: number };

export function validateChapterQuery(query: unknown): ValidationResult<ValidatedChapterQuery> {
  if (!isObject(query)) return { ok: false, error: 'query must be an object' };
  const { chapter } = query;
  if (typeof chapter !== 'string') return { ok: false, error: 'chapter is required' };
  const chapterNum = Number(chapter);
  if (!Number.isInteger(chapterNum) || chapterNum < MIN_CHAPTER || chapterNum > MAX_CHAPTER) {
    return { ok: false, error: `chapter must be integer in ${MIN_CHAPTER}..${MAX_CHAPTER}` };
  }
  return { ok: true, data: { chapter: chapterNum } };
}
