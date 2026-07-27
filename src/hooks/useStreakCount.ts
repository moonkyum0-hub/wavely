import { useEffect, useState } from "react";
import { getRecords } from "@/lib/healthService";
import { currentStreak } from "@/lib/streak";

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 현재 연속 기록 일수를 불러온다.
 * 아직 모르는 동안에는 0이 아니라 null — 기록이 없다고 단정하지 않기 위해.
 */
export function useStreakCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const recs = await getRecords("2000-01-01", toDateStr(new Date()));
        setCount(currentStreak(recs.map((r) => r.date)));
      } catch {
        // dev browser mode — no Tauri runtime
      }
    })();
  }, []);

  return count;
}
