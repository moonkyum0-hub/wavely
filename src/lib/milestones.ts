import type { HealthRecord, CognitiveTest, CognitiveTestType } from "./models";

export type MilestoneCategory = "cumulative" | "streak" | "personalBest" | "firstTime";

export interface Milestone {
  id: string;
  category: MilestoneCategory;
  title: string;
  /** 무엇을 근거로 주는 배지인지 — 효능 주장 없이 사실만 */
  description: string;
  earned: boolean;
  /** 달성한 날 (YYYY-MM-DD). 첫경험·누적·연속은 그 조건을 만족시킨 날 */
  earnedDate?: string;
  /** 아직인 배지는 얼마나 왔는지 보여준다 (미달성을 실패로 강조하지 않기 위해 %가 아니라 실수치) */
  progress?: { current: number; target: number };
  /** 개인 최고 배지의 실제 기록값 등, 배지에 곁들일 사실 한 줄 */
  detail?: string;
}

export const CUMULATIVE_TARGETS = [7, 30, 100, 365] as const;
export const STREAK_TARGETS = [7, 14, 30] as const;

/**
 * 가장 길었던 연속 기록. "현재" 연속이 아니라 "역대 최고"를 쓰는 이유는
 * 한 번 받은 배지가 공백 때문에 사라지지 않게 하기 위해서다 (완벽주의 방지 원칙).
 */
export function bestStreak(dates: string[]): { length: number; endDate?: string } {
  if (dates.length === 0) return { length: 0 };
  const sorted = [...new Set(dates)].sort();
  let best = 1;
  let bestEnd = sorted[0];
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const gapDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    run = gapDays === 1 ? run + 1 : 1;
    if (run > best) {
      best = run;
      bestEnd = sorted[i];
    }
  }
  return { length: best, endDate: bestEnd };
}

/** 값이 클수록 좋은 지표인지 (반응속도는 낮을수록 빠름) */
function higherIsBetter(testType: CognitiveTestType): boolean {
  return testType !== "reaction";
}

const COGNITIVE_LABEL: Record<CognitiveTestType, string> = {
  reaction: "반응 속도",
  digitSpan: "숫자 기억",
  stroop: "스트룹 정확도",
};

const COGNITIVE_UNIT: Record<CognitiveTestType, string> = {
  reaction: "ms",
  digitSpan: "자리",
  stroop: "%",
};

/**
 * 자기 기록 갱신 — 첫 기록보다 나아진 순간이 있었는지.
 * 남과 비교하지 않고 "과거의 나"와만 비교한다.
 */
function personalBestOf(
  values: { date: string; value: number }[],
  preferHigher: boolean
): { best: number; date: string; improvedOnFirst: boolean } | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a.date.localeCompare(b.date));
  const first = ordered[0].value;
  let best = ordered[0];
  for (const v of ordered) {
    if (preferHigher ? v.value > best.value : v.value < best.value) best = v;
  }
  const improvedOnFirst = preferHigher ? best.value > first : best.value < first;
  return { best: best.value, date: best.date, improvedOnFirst };
}

export function calcMilestones(
  records: HealthRecord[],
  cognitiveTests: CognitiveTest[] = []
): Milestone[] {
  const out: Milestone[] = [];
  const dates = records.map((r) => r.date);
  const sortedDates = [...new Set(dates)].sort();
  const totalDays = sortedDates.length;

  // ── 누적 기록일수 ──
  for (const target of CUMULATIVE_TARGETS) {
    const earned = totalDays >= target;
    out.push({
      id: `cumulative-${target}`,
      category: "cumulative",
      title: `기록한 날 ${target}일`,
      description: `연속이 아니어도 괜찮아요. 지금까지 기록한 날을 모두 더해 ${target}일이에요.`,
      earned,
      earnedDate: earned ? sortedDates[target - 1] : undefined,
      progress: earned ? undefined : { current: totalDays, target },
    });
  }

  // ── 연속 기록 (역대 최고 기준 — 공백이 생겨도 배지는 남는다) ──
  const streak = bestStreak(dates);
  for (const target of STREAK_TARGETS) {
    const earned = streak.length >= target;
    out.push({
      id: `streak-${target}`,
      category: "streak",
      title: `연달아 ${target}일`,
      description: `하루도 빠짐없이 ${target}일을 이어간 적이 있어요. 이후 공백이 생겨도 이 기록은 그대로예요.`,
      earned,
      earnedDate: earned ? streak.endDate : undefined,
      progress: earned ? undefined : { current: streak.length, target },
    });
  }

  // ── 개인 최고 (과거의 나와 비교) ──
  const sleepPB = personalBestOf(
    records.filter((r) => r.sleepHours != null).map((r) => ({ date: r.date, value: r.sleepHours as number })),
    true
  );
  if (sleepPB) {
    out.push({
      id: "pb-sleep",
      category: "personalBest",
      title: "수면 자기 기록 갱신",
      description: "처음 기록했을 때보다 더 오래 잔 날이 있어요.",
      earned: sleepPB.improvedOnFirst,
      earnedDate: sleepPB.improvedOnFirst ? sleepPB.date : undefined,
      detail: `최고 ${sleepPB.best}h`,
    });
  }

  const exercisePB = personalBestOf(
    records.filter((r) => r.exerciseMin != null).map((r) => ({ date: r.date, value: r.exerciseMin as number })),
    true
  );
  if (exercisePB) {
    out.push({
      id: "pb-exercise",
      category: "personalBest",
      title: "운동 자기 기록 갱신",
      description: "처음 기록했을 때보다 더 오래 움직인 날이 있어요.",
      earned: exercisePB.improvedOnFirst,
      earnedDate: exercisePB.improvedOnFirst ? exercisePB.date : undefined,
      detail: `최고 ${exercisePB.best}분`,
    });
  }

  const testTypes = [...new Set(cognitiveTests.map((t) => t.testType))];
  for (const testType of testTypes) {
    const pb = personalBestOf(
      cognitiveTests.filter((t) => t.testType === testType).map((t) => ({ date: t.date, value: t.metricValue })),
      higherIsBetter(testType)
    );
    if (!pb) continue;
    out.push({
      id: `pb-${testType}`,
      category: "personalBest",
      title: `${COGNITIVE_LABEL[testType]} 자기 기록 갱신`,
      description: "처음 측정했을 때보다 더 나은 결과를 낸 날이 있어요.",
      earned: pb.improvedOnFirst,
      earnedDate: pb.improvedOnFirst ? pb.date : undefined,
      detail: `최고 ${pb.best}${COGNITIVE_UNIT[testType]}`,
    });
  }

  // ── 첫 경험 ──
  out.push({
    id: "first-record",
    category: "firstTime",
    title: "첫 기록",
    description: "가장 처음 남긴 건강 기록이에요. 여기서 시작했어요.",
    earned: totalDays > 0,
    earnedDate: sortedDates[0],
  });

  const cognitiveDates = cognitiveTests.map((t) => t.date).sort();
  out.push({
    id: "first-cognitive",
    category: "firstTime",
    title: "첫 인지 검사",
    description: "인지 검사를 처음 측정한 날이에요.",
    earned: cognitiveTests.length > 0,
    earnedDate: cognitiveDates[0],
  });

  const allThree = (["reaction", "digitSpan", "stroop"] as CognitiveTestType[]).every((t) =>
    cognitiveTests.some((c) => c.testType === t)
  );
  out.push({
    id: "first-all-cognitive",
    category: "firstTime",
    title: "인지 검사 3종 경험",
    description: "숫자 기억 · 스트룹 · 반응 속도를 모두 한 번씩 측정해봤어요.",
    earned: allThree,
    earnedDate: allThree ? cognitiveDates[cognitiveDates.length - 1] : undefined,
    progress: allThree ? undefined : { current: testTypes.length, target: 3 },
  });

  const firstNote = records.filter((r) => r.note && r.note.trim()).map((r) => r.date).sort()[0];
  out.push({
    id: "first-note",
    category: "firstTime",
    title: "첫 메모",
    description: "숫자로 남지 않는 그날의 이야기를 처음 적은 날이에요.",
    earned: !!firstNote,
    earnedDate: firstNote,
  });

  return out;
}

export const CATEGORY_LABEL: Record<MilestoneCategory, string> = {
  cumulative: "누적 기록",
  streak: "연속 기록",
  personalBest: "자기 기록 갱신",
  firstTime: "첫 경험",
};
