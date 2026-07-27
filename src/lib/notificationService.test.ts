import { describe, it, expect } from "vitest";
import { parseTimeToMinutes, shouldRemindNow } from "./notificationService";

function at(h: number, m: number) {
  return new Date(2026, 6, 26, h, m, 0);
}
const TODAY = "2026-07-26";

describe("parseTimeToMinutes", () => {
  it("HH:MM을 자정 기준 분으로 바꾼다", () => {
    expect(parseTimeToMinutes("00:00")).toBe(0);
    expect(parseTimeToMinutes("20:00")).toBe(1200);
    expect(parseTimeToMinutes("23:59")).toBe(1439);
    expect(parseTimeToMinutes("9:05")).toBe(545);
  });

  it("형식이 잘못됐거나 범위를 벗어나면 null", () => {
    expect(parseTimeToMinutes("")).toBeNull();
    expect(parseTimeToMinutes("24:00")).toBeNull();
    expect(parseTimeToMinutes("12:60")).toBeNull();
    expect(parseTimeToMinutes("아침")).toBeNull();
  });
});

describe("shouldRemindNow", () => {
  const base = {
    enabled: true,
    reminderTime: "20:00",
    now: at(20, 30),
    lastSentDate: null as string | null,
    hasTodayRecord: false,
  };

  it("예약 시각을 지났고 오늘 기록이 없으면 알린다", () => {
    expect(shouldRemindNow(base)).toBe(true);
  });

  it("예약 시각 전이면 알리지 않는다", () => {
    expect(shouldRemindNow({ ...base, now: at(19, 59) })).toBe(false);
  });

  it("정각에는 알린다", () => {
    expect(shouldRemindNow({ ...base, now: at(20, 0) })).toBe(true);
  });

  it("꺼져 있으면 알리지 않는다", () => {
    expect(shouldRemindNow({ ...base, enabled: false })).toBe(false);
  });

  it("오늘 이미 기록했으면 알리지 않는다 (재촉하지 않기)", () => {
    expect(shouldRemindNow({ ...base, hasTodayRecord: true })).toBe(false);
  });

  it("오늘 이미 보냈으면 다시 알리지 않는다", () => {
    expect(shouldRemindNow({ ...base, lastSentDate: TODAY })).toBe(false);
  });

  it("어제 보낸 기록은 오늘 알림을 막지 않는다", () => {
    expect(shouldRemindNow({ ...base, lastSentDate: "2026-07-25" })).toBe(true);
  });

  it("시간 형식이 깨져 있으면 알리지 않는다", () => {
    expect(shouldRemindNow({ ...base, reminderTime: "밤에" })).toBe(false);
  });
});
