import { describe, it, expect } from "vitest";
import { avatarInitial, greeting, displayName, MAX_NAME_LENGTH } from "./profile";

describe("avatarInitial", () => {
  it("이름의 첫 글자를 쓴다", () => {
    expect(avatarInitial("김지현")).toBe("김");
    expect(avatarInitial("moony")).toBe("M");
  });

  it("이름이 없으면 앱 이니셜로 대체한다 (가짜 이름을 지어내지 않음)", () => {
    expect(avatarInitial("")).toBe("W");
    expect(avatarInitial("   ")).toBe("W");
  });

  it("이모지처럼 여러 코드 유닛인 글자도 깨지지 않는다", () => {
    expect(avatarInitial("🌊파도")).toBe("🌊");
  });
});

describe("greeting", () => {
  it("이름이 있으면 이름을 부른다", () => {
    expect(greeting("지현")).toBe("안녕하세요, 지현님 👋");
  });

  it("이름이 없으면 이름 자리를 비우고 자연스럽게 인사한다", () => {
    expect(greeting("")).toBe("안녕하세요 👋");
    expect(greeting("  ")).toBe("안녕하세요 👋");
  });
});

describe("displayName", () => {
  it("이름이 있으면 그대로 보여준다", () => {
    expect(displayName("김지현")).toBe("김지현");
  });

  it("이름이 없으면 미설정임을 밝힌다", () => {
    expect(displayName("")).toBe("이름 미설정");
  });
});

describe("MAX_NAME_LENGTH", () => {
  it("이름 길이 상한이 정의되어 있다", () => {
    expect(MAX_NAME_LENGTH).toBeGreaterThan(0);
  });
});
