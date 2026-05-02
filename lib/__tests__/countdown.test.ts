import { describe, it, expect } from 'vitest';
import {
  COUNTDOWN_SECONDS,
  getCountdownLabel,
  countdownRemaining,
} from '@/lib/countdown';

describe('COUNTDOWN_SECONDS', () => {
  it('is 3 seconds', () => {
    expect(COUNTDOWN_SECONDS).toBe(3);
  });
});

describe('getCountdownLabel', () => {
  it('shows the digit when 1..N seconds remain', () => {
    expect(getCountdownLabel(3)).toBe('3');
    expect(getCountdownLabel(2)).toBe('2');
    expect(getCountdownLabel(1)).toBe('1');
  });

  it('shows the start label when 0 or fewer seconds remain', () => {
    expect(getCountdownLabel(0)).toBe('始まり！');
    expect(getCountdownLabel(-1)).toBe('始まり！');
  });
});

describe('countdownRemaining', () => {
  const start = 1_000_000;

  it('returns the full duration at the start', () => {
    expect(countdownRemaining(start, start)).toBe(COUNTDOWN_SECONDS);
  });

  it('decreases per second elapsed', () => {
    expect(countdownRemaining(start, start + 1000)).toBe(COUNTDOWN_SECONDS - 1);
    expect(countdownRemaining(start, start + 2000)).toBe(COUNTDOWN_SECONDS - 2);
  });

  it('becomes 0 (start label) when full duration has elapsed', () => {
    expect(countdownRemaining(start, start + COUNTDOWN_SECONDS * 1000)).toBe(0);
  });

  it('clamps to 0 once the countdown is over', () => {
    expect(countdownRemaining(start, start + (COUNTDOWN_SECONDS + 5) * 1000)).toBe(0);
  });

  it('uses ceiling so within the last second it still shows 1', () => {
    expect(countdownRemaining(start, start + 2500)).toBe(1);
  });
});
