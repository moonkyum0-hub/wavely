import type { HealthRecord, CognitiveTest, CognitiveTestType } from "./models";

/**
 * 상관관계 분석 — Exist.io 반면교사.
 * 표본이 적으면 아예 보여주지 않고, 보여줄 때도 "경향"으로만 말한다.
 * 인과("때문에", "덕분에", "좋아집니다")로 읽힐 수 있는 표현은 쓰지 않는다.
 */

/** 이 미만이면 노이즈일 가능성이 커서 결과를 만들지 않는다 */
export const MIN_SAMPLES = 5;

export type HealthMetric = "sleepHours" | "exerciseMin" | "waterMl" | "condition";

export type CorrelationStrength = "none" | "weak" | "moderate" | "strong";

export interface CorrelationResult {
  metric: HealthMetric;
  testType: CognitiveTestType;
  /** 피어슨 상관계수 (-1 ~ 1) */
  r: number;
  /** 같은 날 둘 다 기록된 날의 수 */
  n: number;
  strength: CorrelationStrength;
  /** 화면에 그대로 쓰는 한 줄 — 공존(경향) 언어만 사용 */
  summary: string;
}

export const METRIC_LABEL: Record<HealthMetric, string> = {
  sleepHours: "수면 시간",
  exerciseMin: "운동 시간",
  waterMl: "수분 섭취",
  condition: "컨디션",
};

export const TEST_LABEL: Record<CognitiveTestType, string> = {
  reaction: "반응 속도",
  digitSpan: "숫자 기억",
  stroop: "스트룹 정확도",
};

/** 반응 속도만 값이 작을수록 빠른 결과다 */
function lowerIsBetter(testType: CognitiveTestType): boolean {
  return testType === "reaction";
}

export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n !== ys.length || n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx;
    const b = ys[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  // 한쪽이 전부 같은 값이면 상관을 정의할 수 없다 — 0으로 뭉개지 않고 null
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

export function strengthOf(r: number): CorrelationStrength {
  const a = Math.abs(r);
  if (a < 0.2) return "none";
  if (a < 0.4) return "weak";
  if (a < 0.6) return "moderate";
  return "strong";
}

const STRENGTH_WORD: Record<Exclude<CorrelationStrength, "none">, string> = {
  weak: "약하게",
  moderate: "어느 정도",
  strong: "뚜렷하게",
};

function buildSummary(
  metric: HealthMetric,
  testType: CognitiveTestType,
  r: number,
  n: number
): string {
  const strength = strengthOf(r);
  const m = METRIC_LABEL[metric];
  const t = TEST_LABEL[testType];
  if (strength === "none") {
    return `${m}과(와) ${t} 사이에 뚜렷한 경향은 아직 보이지 않아요 (같은 날 기록 ${n}일).`;
  }
  // 반응 속도는 값이 작을수록 빠르므로, 사용자에게 보이는 문장에서 방향을 뒤집어 설명한다
  const positiveTogether = lowerIsBetter(testType) ? r < 0 : r > 0;
  const testPhrase = lowerIsBetter(testType)
    ? positiveTogether ? "반응 속도가 빠른" : "반응 속도가 느린"
    : positiveTogether ? `${t} 결과가 높은` : `${t} 결과가 낮은`;
  return `${m}이(가) 많은 날에 ${testPhrase} 편이 ${STRENGTH_WORD[strength]} 함께 나타났어요 (같은 날 기록 ${n}일).`;
}

function metricValue(r: HealthRecord, metric: HealthMetric): number | undefined {
  return r[metric];
}

/**
 * 같은 날짜에 건강 기록과 인지 검사가 모두 있는 날만 짝지어 상관을 계산한다.
 * 하루에 같은 검사를 여러 번 했다면 그날의 평균을 쓴다.
 */
export function calcCorrelations(
  records: HealthRecord[],
  tests: CognitiveTest[]
): CorrelationResult[] {
  const recordByDate = new Map<string, HealthRecord>();
  records.forEach((r) => recordByDate.set(r.date, r));

  const results: CorrelationResult[] = [];
  const testTypes = [...new Set(tests.map((t) => t.testType))];
  const metrics: HealthMetric[] = ["sleepHours", "exerciseMin", "waterMl", "condition"];

  for (const testType of testTypes) {
    // 같은 날 여러 번 측정했으면 평균
    const byDate = new Map<string, number[]>();
    tests
      .filter((t) => t.testType === testType)
      .forEach((t) => {
        const list = byDate.get(t.date) ?? [];
        list.push(t.metricValue);
        byDate.set(t.date, list);
      });

    for (const metric of metrics) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (const [date, values] of byDate) {
        const rec = recordByDate.get(date);
        const mv = rec ? metricValue(rec, metric) : undefined;
        if (mv == null) continue;
        xs.push(mv);
        ys.push(values.reduce((a, b) => a + b, 0) / values.length);
      }
      if (xs.length < MIN_SAMPLES) continue;
      const r = pearson(xs, ys);
      if (r == null) continue;
      results.push({
        metric,
        testType,
        r,
        n: xs.length,
        strength: strengthOf(r),
        summary: buildSummary(metric, testType, r, xs.length),
      });
    }
  }

  // 경향이 뚜렷한 순서로
  return results.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}
