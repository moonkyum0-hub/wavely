/**
 * 현재 연속 기록 일수.
 *
 * 오늘 아직 기록하지 않았다면 어제부터 센다 — 하루가 끝나기 전에 연속이 끊긴 것처럼
 * 보이면 재촉이 되기 때문이다 (완벽주의 방지 원칙).
 */
export function currentStreak(dates: Iterable<string>, today = new Date()): number {
  const set = dates instanceof Set ? dates : new Set(dates);
  const toStr = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (!set.has(toStr(cursor))) cursor.setDate(cursor.getDate() - 1);

  let count = 0;
  while (set.has(toStr(cursor))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
