import { describe, it, expect } from "vitest";
import { BODY_FUNCTIONS } from "./bodyFunctions";

describe("body function taxonomy", () => {
  it("id가 중복되지 않는다", () => {
    const ids = BODY_FUNCTIONS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("모든 기능은 최소 하나의 데이터 소스에 연결되어 있다", () => {
    for (const fn of BODY_FUNCTIONS) {
      const hasSource =
        (fn.exerciseCategories?.length ?? 0) > 0 ||
        fn.usesSleep || fn.usesWater || fn.usesCondition || fn.usesCognitive;
      expect(hasSource, `${fn.id} has no data source`).toBeTruthy();
    }
  });

  it('설명 문구는 측정·관찰 언어만 사용한다 — "향상"·"훈련" 주장 금지 (Lumosity/FTC 가드레일)', () => {
    for (const fn of BODY_FUNCTIONS) {
      expect(fn.blurb).not.toMatch(/향상시|훈련하|좋아집니다|개선됩니다/);
    }
  });
});
