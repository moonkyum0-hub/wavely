import { describe, it, expect } from "vitest";
import { bestStreak, calcMilestones } from "./milestones";
import type { HealthRecord, CognitiveTest } from "./models";

function rec(date: string, extra: Partial<HealthRecord> = {}): HealthRecord {
  return { date, ...extra };
}
function days(n: number, from = "2026-07-01"): string[] {
  const start = new Date(from + "T00:00:00");
  return Array.from({ length: n }, (_, i) =>
    new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10)
  );
}

describe("bestStreak", () => {
  it("기록이 없으면 0", () => {
    expect(bestStreak([])).toEqual({ length: 0 });
  });

  it("연속된 날들의 길이를 센다", () => {
    expect(bestStreak(["2026-07-01", "2026-07-02", "2026-07-03"])).toEqual({
      length: 3,
      endDate: "2026-07-03",
    });
  });

  it("공백이 있으면 가장 긴 구간을 고른다", () => {
    const r = bestStreak(["2026-07-01", "2026-07-02", "2026-07-09", "2026-07-10", "2026-07-11"]);
    expect(r.length).toBe(3);
    expect(r.endDate).toBe("2026-07-11");
  });

  it("이후에 공백이 생겨도 역대 최고 기록은 줄어들지 않는다 (완벽주의 방지)", () => {
    const withGap = bestStreak([...days(10), "2026-07-20"]);
    expect(withGap.length).toBe(10);
  });

  it("순서가 뒤섞이거나 중복돼도 정확히 센다", () => {
    expect(bestStreak(["2026-07-03", "2026-07-01", "2026-07-02", "2026-07-02"]).length).toBe(3);
  });
});

describe("calcMilestones — 누적 기록", () => {
  it("기록이 없으면 누적 배지는 모두 미달성이고 진행 상황을 보여준다", () => {
    const ms = calcMilestones([]);
    const seven = ms.find((m) => m.id === "cumulative-7")!;
    expect(seven.earned).toBe(false);
    expect(seven.progress).toEqual({ current: 0, target: 7 });
  });

  it("7일을 기록하면 누적 7일 배지를 받는다", () => {
    const ms = calcMilestones(days(7).map((d) => rec(d)));
    expect(ms.find((m) => m.id === "cumulative-7")!.earned).toBe(true);
    expect(ms.find((m) => m.id === "cumulative-30")!.earned).toBe(false);
  });

  it("연속이 아니어도 누적일수로 인정한다", () => {
    const scattered = ["2026-07-01", "2026-07-05", "2026-07-09", "2026-07-14", "2026-07-20", "2026-07-25", "2026-08-02"];
    expect(calcMilestones(scattered.map((d) => rec(d))).find((m) => m.id === "cumulative-7")!.earned).toBe(true);
  });
});

describe("calcMilestones — 연속 기록", () => {
  it("연달아 7일이면 배지를 받고, 이후 공백이 생겨도 유지된다", () => {
    const ms = calcMilestones([...days(7), "2026-07-30"].map((d) => rec(d)));
    expect(ms.find((m) => m.id === "streak-7")!.earned).toBe(true);
    expect(ms.find((m) => m.id === "streak-14")!.earned).toBe(false);
  });
});

describe("calcMilestones — 자기 기록 갱신", () => {
  it("처음보다 나아진 날이 있으면 달성", () => {
    const ms = calcMilestones([
      rec("2026-07-01", { sleepHours: 6 }),
      rec("2026-07-02", { sleepHours: 8 }),
    ]);
    const pb = ms.find((m) => m.id === "pb-sleep")!;
    expect(pb.earned).toBe(true);
    expect(pb.detail).toBe("최고 8h");
  });

  it("첫 기록이 계속 최고면 아직 갱신은 아니다", () => {
    const ms = calcMilestones([
      rec("2026-07-01", { sleepHours: 8 }),
      rec("2026-07-02", { sleepHours: 6 }),
    ]);
    expect(ms.find((m) => m.id === "pb-sleep")!.earned).toBe(false);
  });

  it("반응 속도는 값이 낮아져야 갱신으로 본다", () => {
    const tests: CognitiveTest[] = [
      { date: "2026-07-01", testType: "reaction", metricValue: 400 },
      { date: "2026-07-02", testType: "reaction", metricValue: 320 },
    ];
    const pb = calcMilestones([], tests).find((m) => m.id === "pb-reaction")!;
    expect(pb.earned).toBe(true);
    expect(pb.detail).toBe("최고 320ms");
  });

  it("기록이 없는 지표는 배지 자체를 만들지 않는다 (데이터 정직성)", () => {
    const ms = calcMilestones([rec("2026-07-01", { sleepHours: 7 })]);
    expect(ms.some((m) => m.id === "pb-exercise")).toBe(false);
    expect(ms.some((m) => m.id === "pb-reaction")).toBe(false);
  });
});

describe("calcMilestones — 첫 경험", () => {
  it("첫 기록 배지는 가장 이른 날짜를 가리킨다", () => {
    const ms = calcMilestones([rec("2026-07-05"), rec("2026-07-01")]);
    const first = ms.find((m) => m.id === "first-record")!;
    expect(first.earned).toBe(true);
    expect(first.earnedDate).toBe("2026-07-01");
  });

  it("인지 검사 3종을 모두 해봐야 3종 경험 배지를 받는다", () => {
    const two: CognitiveTest[] = [
      { date: "2026-07-01", testType: "reaction", metricValue: 350 },
      { date: "2026-07-02", testType: "stroop", metricValue: 90 },
    ];
    const partial = calcMilestones([], two).find((m) => m.id === "first-all-cognitive")!;
    expect(partial.earned).toBe(false);
    expect(partial.progress).toEqual({ current: 2, target: 3 });

    const all = calcMilestones([], [...two, { date: "2026-07-03", testType: "digitSpan", metricValue: 7 }]);
    expect(all.find((m) => m.id === "first-all-cognitive")!.earned).toBe(true);
  });

  it("빈 메모는 첫 메모로 치지 않는다", () => {
    const ms = calcMilestones([rec("2026-07-01", { note: "   " })]);
    expect(ms.find((m) => m.id === "first-note")!.earned).toBe(false);
  });
});
