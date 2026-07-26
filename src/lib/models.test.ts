import { describe, it, expect } from "vitest";
import { calcWaveScore } from "./models";

const T = { sleep: 8, exercise: 30, water: 2000 };

describe("calcWaveScore", () => {
  it("세 지표 모두 목표치를 채우면 100점", () => {
    expect(calcWaveScore({ sleepHours: 8, exerciseMin: 30, waterMl: 2000 }, T)).toBe(100);
  });

  it("기록이 하나도 없으면 null (데이터 정직성 — 0점 아님)", () => {
    expect(calcWaveScore({}, T)).toBeNull();
  });

  it("컨디션만 기록해도 null (컨디션은 점수에 반영되지 않음)", () => {
    expect(calcWaveScore({ condition: 5 }, T)).toBeNull();
  });

  it("목표치를 초과해도 100점을 넘지 않는다", () => {
    expect(calcWaveScore({ sleepHours: 12, exerciseMin: 120, waterMl: 5000 }, T)).toBe(100);
  });

  it("한 지표만 있으면 그 지표만으로 평균낸다 (동일 비중, 부분 기록 허용)", () => {
    expect(calcWaveScore({ exerciseMin: 30 }, T)).toBe(100);
    expect(calcWaveScore({ exerciseMin: 15 }, T)).toBe(50);
  });

  it("세 지표가 각각 절반 수준이면 평균도 50점", () => {
    expect(calcWaveScore({ sleepHours: 4, exerciseMin: 15, waterMl: 1000 }, T)).toBe(50);
  });

  it("목표치가 사용자마다 다르면 그 목표 기준으로 계산된다", () => {
    expect(calcWaveScore({ sleepHours: 6 }, { sleep: 6, exercise: 30, water: 2000 })).toBe(100);
  });
});
