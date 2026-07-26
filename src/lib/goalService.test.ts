import { describe, it, expect } from "vitest";
import { getTargets } from "./goalService";
import type { Goal } from "./models";

function goal(type: Goal["type"], targetValue: number): Goal {
  return { type, title: "", targetValue, period: "daily", isActive: true };
}

describe("getTargets", () => {
  it("활성 목표가 있으면 그 값을 사용한다 (water는 ml로 변환)", () => {
    const goals = [goal("sleep", 7), goal("exercise", 20), goal("water", 1.5)];
    expect(getTargets(goals)).toEqual({ sleep: 7, exercise: 20, water: 1500 });
  });

  it("특정 목표가 없으면 기본 템플릿 값을 쓴다", () => {
    const goals = [goal("sleep", 7)];
    expect(getTargets(goals)).toEqual({ sleep: 7, exercise: 30, water: 2000 });
  });

  it("활성 목표가 하나도 없으면 전부 기본 템플릿 값", () => {
    expect(getTargets([])).toEqual({ sleep: 8, exercise: 30, water: 2000 });
  });
});
