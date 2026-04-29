export function formatTime(ms: number): string {
  const totalTenths = Math.floor(ms / 100);
  const tenths = totalTenths % 10;
  const totalSecs = Math.floor(totalTenths / 10);
  const secs = totalSecs % 60;
  const mins = Math.floor(totalSecs / 60);
  if (mins > 0) {
    return `${mins}分${String(secs).padStart(2, '0')}.${tenths}秒`;
  }
  return `${secs}.${tenths}秒`;
}
