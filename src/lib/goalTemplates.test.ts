import { describe, it, expect } from "vitest";
import { PERSONAS, PERSONA_GOAL_TEMPLATE, DEFAULT_GOAL_TEMPLATE } from "./goalTemplates";

const VALID_TYPES = ["sleep", "exercise", "water", "wave", "custom"];

describe("goal templates", () => {
  it("모든 페르소나에 대응하는 목표 템플릿이 존재한다", () => {
    for (const p of PERSONAS) {
      expect(PERSONA_GOAL_TEMPLATE[p.id]).toBeDefined();
      expect(PERSONA_GOAL_TEMPLATE[p.id].length).toBeGreaterThan(0);
    }
  });

  it("모든 템플릿 목표의 type이 유효하고 targetValue가 양수다", () => {
    const all = [...DEFAULT_GOAL_TEMPLATE, ...Object.values(PERSONA_GOAL_TEMPLATE).flat()];
    for (const g of all) {
      expect(VALID_TYPES).toContain(g.type);
      expect(g.targetValue).toBeGreaterThan(0);
      expect(g.isActive).toBe(true);
    }
  });

  it("페르소나 템플릿은 한 종류의 목표를 중복 생성하지 않는다", () => {
    for (const template of Object.values(PERSONA_GOAL_TEMPLATE)) {
      const types = template.map((g) => g.type);
      expect(new Set(types).size).toBe(types.length);
    }
  });

  it("환자 페르소나의 운동 목표는 기본값보다 부담이 적다", () => {
    const patientExercise = PERSONA_GOAL_TEMPLATE.patient.find((g) => g.type === "exercise")!;
    const defaultExercise = DEFAULT_GOAL_TEMPLATE.find((g) => g.type === "exercise")!;
    expect(patientExercise.targetValue).toBeLessThan(defaultExercise.targetValue);
  });
});
