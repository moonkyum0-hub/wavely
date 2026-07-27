/**
 * 사용자 프로필 (표시용 이름).
 *
 * 페르소나·온보딩·리마인더와 같은 localStorage 계열로 둔다 — 기기별 표시 설정이라
 * 기록 데이터처럼 백업/내보내기 대상이 아니기 때문이다.
 *
 * 이름을 정하지 않았으면 그럴듯한 가짜 이름을 지어내지 않고 빈 값으로 두고,
 * 화면에서는 이름 없이 말을 건다 (데이터 정직성).
 */

export const PROFILE_NAME_KEY = "wavely-profile-name";

export const MAX_NAME_LENGTH = 20;

export function getProfileName(): string {
  try {
    return (localStorage.getItem(PROFILE_NAME_KEY) ?? "").trim();
  } catch {
    return "";
  }
}

export function setProfileName(name: string) {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  try {
    if (trimmed) localStorage.setItem(PROFILE_NAME_KEY, trimmed);
    else localStorage.removeItem(PROFILE_NAME_KEY);
  } catch {
    // localStorage unavailable
  }
}

/** 아바타에 쓸 한 글자. 이름이 없으면 앱 이니셜로 대체한다. */
export function avatarInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "W";
  return [...trimmed][0].toUpperCase();
}

/** 인사말. 이름이 없으면 이름 자리를 비우고 자연스럽게 말한다. */
export function greeting(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `안녕하세요, ${trimmed}님 👋` : "안녕하세요 👋";
}

/** 사이드바 등에 쓰는 표시 이름. 비어 있으면 안내 문구로 대체한다. */
export function displayName(name: string): string {
  return name.trim() || "이름 미설정";
}
