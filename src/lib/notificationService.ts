import { isTauri } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * 일일 리마인더.
 *
 * 데스크톱 Tauri에는 OS 레벨 예약 알림이 없어서, 앱이 켜져 있는 동안 정해진 시각을
 * 지나면 그날 한 번만 알린다. 이 한계는 설정 화면 카피에도 그대로 밝힌다
 * (없는 기능을 있는 것처럼 보이게 하지 않는다).
 */

export const REMINDER_ENABLED_KEY = "wavely-reminder-enabled";
export const REMINDER_TIME_KEY = "wavely-reminder-time";
/** 마지막으로 리마인더를 보낸 날 — 하루 한 번만 알리기 위해 */
export const REMINDER_LAST_SENT_KEY = "wavely-reminder-last-sent";

export const DEFAULT_REMINDER_TIME = "20:00";

function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable
  }
}

export function isReminderEnabled(): boolean {
  return readLocal(REMINDER_ENABLED_KEY) === "true";
}

export function setReminderEnabled(on: boolean) {
  writeLocal(REMINDER_ENABLED_KEY, String(on));
}

export function getReminderTime(): string {
  return readLocal(REMINDER_TIME_KEY) ?? DEFAULT_REMINDER_TIME;
}

export function setReminderTime(hhmm: string) {
  writeLocal(REMINDER_TIME_KEY, hhmm);
}

/** 알림 권한을 확인하고, 없으면 한 번 요청한다. 허용됐는지를 돌려준다. */
export async function ensurePermission(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    if (await isPermissionGranted()) return true;
    return (await requestPermission()) === "granted";
  } catch {
    // dev browser mode — no Tauri runtime
    return false;
  }
}

export async function sendReminderNow(title: string, body: string): Promise<boolean> {
  if (!(await ensurePermission())) return false;
  try {
    sendNotification({ title, body });
    return true;
  } catch {
    return false;
  }
}

/** "HH:MM" → 자정 기준 분. 형식이 이상하면 null. */
export function parseTimeToMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * 지금 리마인더를 보내야 하는지 판단한다 (순수 함수 — 테스트 가능).
 * 조건: 켜져 있고 · 예약 시각을 지났고 · 오늘 아직 안 보냈고 · 오늘 기록이 아직 없음.
 */
export function shouldRemindNow(opts: {
  enabled: boolean;
  reminderTime: string;
  now: Date;
  lastSentDate: string | null;
  hasTodayRecord: boolean;
}): boolean {
  const { enabled, reminderTime, now, lastSentDate, hasTodayRecord } = opts;
  if (!enabled || hasTodayRecord) return false;
  const target = parseTimeToMinutes(reminderTime);
  if (target == null) return false;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  if (nowMinutes < target) return false;
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return lastSentDate !== today;
}

export function getLastSentDate(): string | null {
  return readLocal(REMINDER_LAST_SENT_KEY);
}

export function markRemindedToday(now = new Date()) {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  writeLocal(REMINDER_LAST_SENT_KEY, today);
}
