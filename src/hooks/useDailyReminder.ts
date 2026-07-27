import { useEffect } from "react";
import { getRecord } from "@/lib/healthService";
import {
  getLastSentDate,
  getReminderTime,
  isReminderEnabled,
  markRemindedToday,
  sendReminderNow,
  shouldRemindNow,
} from "@/lib/notificationService";

/** 1분마다 확인 — 예약 시각을 놓치지 않을 만큼 자주, 부담은 없을 만큼 드물게 */
const CHECK_INTERVAL_MS = 60_000;

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 앱이 켜져 있는 동안 일일 리마인더를 확인한다.
 * 이미 오늘 기록했으면 보내지 않는다 — 다 한 사람을 재촉하지 않기 위해.
 */
export function useDailyReminder() {
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (cancelled || !isReminderEnabled()) return;
      const now = new Date();
      let hasTodayRecord = false;
      try {
        hasTodayRecord = (await getRecord(toDateStr(now))) != null;
      } catch {
        // dev browser mode — no Tauri runtime, 알림도 어차피 못 보낸다
        return;
      }
      if (cancelled) return;
      const due = shouldRemindNow({
        enabled: isReminderEnabled(),
        reminderTime: getReminderTime(),
        now,
        lastSentDate: getLastSentDate(),
        hasTodayRecord,
      });
      if (!due) return;
      const sent = await sendReminderNow(
        "오늘의 파도",
        "잠깐 시간 될 때 오늘을 기록해보세요. 짧아도 괜찮아요."
      );
      if (sent) markRemindedToday(now);
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
}
