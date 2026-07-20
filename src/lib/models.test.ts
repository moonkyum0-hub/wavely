import { describe, it, expect } from "vitest";
import { calcWaveScore } from "./models";

describe("calcWaveScore", () => {
  it("모든 지표가 목표치일 때 100점", () => {
    expect(calcWaveScore({ sleepHours: 8, exerciseMin: 30, waterMl: 2000, condition: 5 })).toBe(100);
  });

  it("기록이 하나도 없으면 0점", () => {
    expect(calcWaveScore({})).toBe(0);
  });

  it("목표치를 초과해도 100점을 넘지 않는다 (수면 12h, 운동 120분)", () => {
    expect(calcWaveScore({ sleepHours: 12, exerciseMin: 120, waterMl: 5000, condition: 5 })).toBe(100);
  });

  it("수면만 채우면 가중치 35%만큼만 반영된다", () => {
    expect(calcWaveScore({ sleepHours: 8 })).toBe(35);
  });

  it("절반 수준의 기록이면 절반 수준의 점수 (반올림 포함)", () => {
    // sleep 4/8=0.5*35 + exercise 15/30=0.5*30 + water 1000/2000=0.5*20 + condition 2.5/5는 불가하므로 3/5*15=9
    const score = calcWaveScore({ sleepHours: 4, exerciseMin: 15, waterMl: 1000, condition: 3 });
    expect(score).toBe(Math.round(17.5 + 15 + 10 + 9));
  });

  it("일부 지표만 있어도 계산된다 (부분 기록 허용 — 데이터 정직성 원칙)", () => {
    expect(calcWaveScore({ exerciseMin: 30 })).toBe(30);
    expect(calcWaveScore({ waterMl: 2000 })).toBe(20);
    expect(calcWaveScore({ condition: 5 })).toBe(15);
  });
});
