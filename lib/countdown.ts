export const COUNTDOWN_SECONDS = 3;

export function getCountdownLabel(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return '始まり！';
  return String(remainingSeconds);
}

export function countdownRemaining(startedAt: number, now: number): number {
  const elapsedMs = now - startedAt;
  const remainingMs = COUNTDOWN_SECONDS * 1000 - elapsedMs;
  if (remainingMs <= 0) return 0;
  return Math.ceil(remainingMs / 1000);
}
