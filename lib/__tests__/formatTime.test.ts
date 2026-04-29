import { describe, it, expect } from 'vitest';
import { formatTime } from '@/lib/formatTime';

describe('formatTime', () => {
  it('formats sub-minute times with seconds and tenths', () => {
    expect(formatTime(0)).toBe('0.0秒');
    expect(formatTime(1500)).toBe('1.5秒');
    expect(formatTime(59900)).toBe('59.9秒');
  });

  it('formats minute-or-greater times with mm分ss.t秒', () => {
    expect(formatTime(60000)).toBe('1分00.0秒');
    expect(formatTime(125400)).toBe('2分05.4秒');
  });

  it('truncates sub-100ms (no rounding)', () => {
    expect(formatTime(1999)).toBe('1.9秒');
    expect(formatTime(2000)).toBe('2.0秒');
  });
});
