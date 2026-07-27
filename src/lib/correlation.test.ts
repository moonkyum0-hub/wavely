import { describe, it, expect } from "vitest";
import { pearson, strengthOf, calcCorrelations, MIN_SAMPLES } from "./correlation";
import type { HealthRecord, CognitiveTest } from "./models";

function pairs(
  n: number,
  sleepAt: (i: number) => number,
  scoreAt: (i: number) => number,
  testType: CognitiveTest["testType"] = "digitSpan"
): { records: HealthRecord[]; tests: CognitiveTest[] } {
  const records: HealthRecord[] = [];
  const tests: CognitiveTest[] = [];
  for (let i = 0; i < n; i++) {
    const date = new Date(Date.UTC(2026, 6, i + 1)).toISOString().slice(0, 10);
    records.push({ date, sleepHours: sleepAt(i) });
    tests.push({ date, testType, metricValue: scoreAt(i) });
  }
  return { records, tests };
}

describe("pearson", () => {
  it("완전한 양의 상관은 1", () => {
    expect(pearson([1, 2, 3, 4], [2, 4, 6, 8])).toBeCloseTo(1, 6);
  });

  it("완전한 음의 상관은 -1", () => {
    expect(pearson([1, 2, 3, 4], [8, 6, 4, 2])).toBeCloseTo(-1, 6);
  });

  it("한쪽 값이 전부 같으면 계산할 수 없으므로 null (0으로 뭉개지 않음)", () => {
    expect(pearson([5, 5, 5, 5], [1, 2, 3, 4])).toBeNull();
  });

  it("표본이 2개 미만이면 null", () => {
    expect(pearson([1], [2])).toBeNull();
    expect(pearson([], [])).toBeNull();
  });

  it("길이가 다르면 null", () => {
    expect(pearson([1, 2, 3], [1, 2])).toBeNull();
  });
});

describe("strengthOf", () => {
  it("|r|이 낮으면 경향 없음으로 본다", () => {
    expect(strengthOf(0.1)).toBe("none");
    expect(strengthOf(-0.19)).toBe("none");
  });

  it("구간별로 약함/보통/뚜렷함을 구분한다", () => {
    expect(strengthOf(0.3)).toBe("weak");
    expect(strengthOf(-0.5)).toBe("moderate");
    expect(strengthOf(0.8)).toBe("strong");
  });
});

describe("calcCorrelations", () => {
  it(`같은 날 기록이 ${MIN_SAMPLES}일 미만이면 결과를 만들지 않는다 (노이즈 방지)`, () => {
    const { records, tests } = pairs(MIN_SAMPLES - 1, (i) => 6 + i, (i) => 5 + i);
    expect(calcCorrelations(records, tests)).toEqual([]);
  });

  it(`같은 날 기록이 ${MIN_SAMPLES}일 이상이면 결과를 만든다`, () => {
    const { records, tests } = pairs(MIN_SAMPLES, (i) => 6 + i, (i) => 5 + i);
    const results = calcCorrelations(records, tests);
    const sleep = results.find((r) => r.metric === "sleepHours")!;
    expect(sleep.n).toBe(MIN_SAMPLES);
    expect(sleep.r).toBeCloseTo(1, 6);
  });

  it("같은 날 둘 다 기록된 날만 표본으로 센다", () => {
    const { records, tests } = pairs(6, (i) => 6 + i, (i) => 5 + i);
    // 검사만 있고 건강 기록이 없는 날을 추가 — 표본 수는 늘지 않아야 한다
    tests.push({ date: "2026-08-15", testType: "digitSpan", metricValue: 99 });
    const sleep = calcCorrelations(records, tests).find((r) => r.metric === "sleepHours")!;
    expect(sleep.n).toBe(6);
  });

  it("인과가 아니라 공존 표현만 쓴다", () => {
    const { records, tests } = pairs(8, (i) => 6 + i, (i) => 5 + i);
    for (const r of calcCorrelations(records, tests)) {
      expect(r.summary).not.toMatch(/때문|덕분|좋아집니다|향상|개선됩니다|효과가 있습니다/);
      expect(r.summary).toMatch(/경향|함께/);
    }
  });

  it("표본 수를 항상 문장에 밝힌다", () => {
    const { records, tests } = pairs(7, (i) => 6 + i, (i) => 5 + i);
    for (const r of calcCorrelations(records, tests)) {
      expect(r.summary).toContain(`${r.n}일`);
    }
  });

  it("반응 속도는 값이 낮을수록 빠른 것으로 설명한다", () => {
    // 수면이 길수록 반응 시간(ms)이 짧아지는 데이터 → r은 음수지만 문장은 "빠른"
    const { records, tests } = pairs(6, (i) => 6 + i, (i) => 400 - i * 20, "reaction");
    const result = calcCorrelations(records, tests).find((r) => r.metric === "sleepHours")!;
    expect(result.r).toBeLessThan(0);
    expect(result.summary).toContain("빠른");
  });

  it("경향이 뚜렷한 순서로 정렬한다", () => {
    const { records, tests } = pairs(8, (i) => 6 + i, (i) => 5 + i);
    records.forEach((r, i) => {
      r.exerciseMin = i % 2 === 0 ? 30 : 20; // 약한 관계
      r.condition = 3;                        // 변화 없음 → 제외되어야 함
    });
    const results = calcCorrelations(records, tests);
    for (let i = 1; i < results.length; i++) {
      expect(Math.abs(results[i - 1].r)).toBeGreaterThanOrEqual(Math.abs(results[i].r));
    }
    // 값이 전부 같은 컨디션은 상관을 정의할 수 없으므로 결과에 없다
    expect(results.some((r) => r.metric === "condition")).toBe(false);
  });
});
