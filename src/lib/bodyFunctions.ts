import type { ExerciseCategory } from "./exerciseData";

export type FunctionStatus = "active" | "locked";

export interface BodyFunction {
  id: string;
  label: string;
  status: FunctionStatus;
  /** Knowledge-based framing only — never an "improves X" claim (see Lumosity/FTC note). */
  blurb: string;
  exerciseCategories?: ExerciseCategory[];
  usesSleep?: boolean;
  usesWater?: boolean;
  usesCondition?: boolean;
}

export const BODY_FUNCTIONS: BodyFunction[] = [
  {
    id: "strength",
    label: "근력",
    status: "active",
    blurb: "코어·상지·하체 운동은 근력과 근지구력에 기여한다고 알려져 있어요.",
    exerciseCategories: ["CORE", "UPPER", "LOWER"],
  },
  {
    id: "cardio",
    label: "심폐지구력",
    status: "active",
    blurb: "유산소 운동은 심장과 폐의 지구력에 기여한다고 알려져 있어요.",
    exerciseCategories: ["CARDIO"],
  },
  {
    id: "flexibility",
    label: "유연성",
    status: "active",
    blurb: "스트레칭·가동성 운동은 관절 가동 범위와 회복에 기여한다고 알려져 있어요.",
    exerciseCategories: ["FLEXIBILITY"],
  },
  {
    id: "metabolism",
    label: "신진대사",
    status: "active",
    blurb: "규칙적인 운동과 수분 섭취는 신진대사를 원활히 유지하는 데 기여한다고 알려져 있어요.",
    exerciseCategories: ["CORE", "UPPER", "LOWER", "CARDIO"],
    usesWater: true,
  },
  {
    id: "sleepRecovery",
    label: "수면 회복력",
    status: "active",
    blurb: "충분한 수면은 신체 회복과 다음 날 컨디션에 기여한다고 알려져 있어요.",
    usesSleep: true,
  },
  {
    id: "stressResilience",
    label: "스트레스 회복",
    status: "active",
    blurb: "유연성 운동과 꾸준한 컨디션 기록은 스트레스 회복력을 살피는 데 도움이 된다고 알려져 있어요.",
    exerciseCategories: ["FLEXIBILITY"],
    usesCondition: true,
  },
  {
    id: "brainFocus",
    label: "뇌 혈류 · 집중력",
    status: "locked",
    blurb: "인지 검사 기능이 추가되면, 유산소 운동과의 관계를 여기서 볼 수 있어요.",
    exerciseCategories: ["CARDIO"],
  },
];
