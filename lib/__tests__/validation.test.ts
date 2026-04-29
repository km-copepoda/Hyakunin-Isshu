import { describe, it, expect } from 'vitest';
import {
  validateScoreInput,
  validateRankingQuery,
  MIN_VALID_TIME_MS,
  MAX_NAME_LENGTH,
  ORDER_MODES,
} from '@/lib/validation';

const validInput = {
  playerId: '11111111-1111-1111-1111-111111111111',
  name: 'taro',
  chapter: 1,
  orderMode: 'sequential',
  timeMs: 30000,
  misses: 2,
};

describe('validateScoreInput', () => {
  it('accepts a valid input', () => {
    const result = validateScoreInput(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.playerId).toBe(validInput.playerId);
      expect(result.data.name).toBe('taro');
    }
  });

  it('rejects non-object input', () => {
    expect(validateScoreInput(null).ok).toBe(false);
    expect(validateScoreInput('foo').ok).toBe(false);
    expect(validateScoreInput(42).ok).toBe(false);
  });

  it('rejects invalid playerId (non-uuid)', () => {
    const result = validateScoreInput({ ...validInput, playerId: 'not-a-uuid' });
    expect(result.ok).toBe(false);
  });

  it('trims name and rejects empty after trim', () => {
    const empty = validateScoreInput({ ...validInput, name: '   ' });
    expect(empty.ok).toBe(false);
    const trimmed = validateScoreInput({ ...validInput, name: '  taro  ' });
    expect(trimmed.ok).toBe(true);
    if (trimmed.ok) expect(trimmed.data.name).toBe('taro');
  });

  it(`rejects name longer than ${MAX_NAME_LENGTH}`, () => {
    const long = 'x'.repeat(MAX_NAME_LENGTH + 1);
    expect(validateScoreInput({ ...validInput, name: long }).ok).toBe(false);
  });

  it('accepts name at the max length boundary', () => {
    const max = 'x'.repeat(MAX_NAME_LENGTH);
    expect(validateScoreInput({ ...validInput, name: max }).ok).toBe(true);
  });

  it('rejects chapter outside 1..10', () => {
    expect(validateScoreInput({ ...validInput, chapter: 0 }).ok).toBe(false);
    expect(validateScoreInput({ ...validInput, chapter: 11 }).ok).toBe(false);
    expect(validateScoreInput({ ...validInput, chapter: 1.5 }).ok).toBe(false);
  });

  it('accepts chapter boundaries 1 and 10', () => {
    expect(validateScoreInput({ ...validInput, chapter: 1 }).ok).toBe(true);
    expect(validateScoreInput({ ...validInput, chapter: 10 }).ok).toBe(true);
  });

  it('rejects unknown orderMode', () => {
    expect(validateScoreInput({ ...validInput, orderMode: 'foo' }).ok).toBe(false);
  });

  it('accepts all valid orderModes', () => {
    for (const mode of ORDER_MODES) {
      expect(validateScoreInput({ ...validInput, orderMode: mode }).ok).toBe(true);
    }
  });

  it(`rejects timeMs below the floor (${MIN_VALID_TIME_MS}ms)`, () => {
    expect(validateScoreInput({ ...validInput, timeMs: MIN_VALID_TIME_MS - 1 }).ok).toBe(false);
  });

  it('accepts timeMs exactly at the floor', () => {
    expect(validateScoreInput({ ...validInput, timeMs: MIN_VALID_TIME_MS }).ok).toBe(true);
  });

  it('rejects negative misses or non-integer', () => {
    expect(validateScoreInput({ ...validInput, misses: -1 }).ok).toBe(false);
    expect(validateScoreInput({ ...validInput, misses: 1.5 }).ok).toBe(false);
  });

  it('accepts zero misses', () => {
    expect(validateScoreInput({ ...validInput, misses: 0 }).ok).toBe(true);
  });
});

describe('validateRankingQuery', () => {
  it('parses chapter and orderMode from strings', () => {
    const result = validateRankingQuery({ chapter: '3', order: 'random' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.chapter).toBe(3);
      expect(result.data.orderMode).toBe('random');
    }
  });

  it('rejects missing chapter', () => {
    expect(validateRankingQuery({ order: 'sequential' }).ok).toBe(false);
  });

  it('rejects bad orderMode', () => {
    expect(validateRankingQuery({ chapter: '1', order: 'nope' }).ok).toBe(false);
  });

  it('rejects chapter out of range', () => {
    expect(validateRankingQuery({ chapter: '11', order: 'sequential' }).ok).toBe(false);
    expect(validateRankingQuery({ chapter: '0', order: 'sequential' }).ok).toBe(false);
  });
});
