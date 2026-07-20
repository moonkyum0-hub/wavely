import type { Goal } from "./models";

export const ONBOARDING_COMPLETE_KEY = "wavely-onboarding-complete";
export const ONBOARDING_PERSONA_KEY = "wavely-persona";

export type PersonaId = "student" | "worker" | "patient";

export const PERSONAS: { id: PersonaId; label: string; emoji: string; desc: string }[] = [
  { id: "student", label: "학생", emoji: "🎓", desc: "시험기간 컨디션 관리, 집중력이 중요해요" },
  { id: "worker",  label: "직장인", emoji: "💼", desc: "바쁜 하루 속 짧은 습관이 필요해요" },
  { id: "patient", label: "환자", emoji: "🩺", desc: "내 몸의 패턴을 천천히 기록하고 싶어요" },
];

export const DEFAULT_GOAL_TEMPLATE: Omit<Goal, "id" | "createdAt">[] = [
  { type: "sleep",    title: "수면 시간", targetValue: 8,  unit: "h",  period: "daily", isActive: true },
  { type: "exercise", title: "운동 시간", targetValue: 30, unit: "분", period: "daily", isActive: true },
  { type: "water",    title: "수분 섭취", targetValue: 2,  unit: "L",  period: "daily", isActive: true },
  { type: "wave",     title: "파도 점수", targetValue: 80, unit: "점", period: "daily", isActive: true },
];

export const PERSONA_GOAL_TEMPLATE: Record<PersonaId, Omit<Goal, "id" | "createdAt">[]> = {
  student: [
    { type: "sleep",    title: "수면 시간", targetValue: 7.5, unit: "h",  period: "daily", isActive: true },
    { type: "exercise", title: "운동 시간", targetValue: 20,  unit: "분", period: "daily", isActive: true },
    { type: "water",    title: "수분 섭취", targetValue: 1.8, unit: "L",  period: "daily", isActive: true },
    { type: "wave",     title: "파도 점수", targetValue: 75,  unit: "점", period: "daily", isActive: true },
  ],
  worker: [
    { type: "sleep",    title: "수면 시간", targetValue: 7,   unit: "h",  period: "daily", isActive: true },
    { type: "exercise", title: "운동 시간", targetValue: 30,  unit: "분", period: "daily", isActive: true },
    { type: "water",    title: "수분 섭취", targetValue: 2,   unit: "L",  period: "daily", isActive: true },
    { type: "wave",     title: "파도 점수", targetValue: 75,  unit: "점", period: "daily", isActive: true },
  ],
  patient: [
    { type: "sleep",    title: "수면 시간", targetValue: 8,   unit: "h",  period: "daily", isActive: true },
    { type: "exercise", title: "운동 시간", targetValue: 15,  unit: "분", period: "daily", isActive: true },
    { type: "water",    title: "수분 섭취", targetValue: 1.5, unit: "L",  period: "daily", isActive: true },
    { type: "wave",     title: "파도 점수", targetValue: 70,  unit: "점", period: "daily", isActive: true },
  ],
};
