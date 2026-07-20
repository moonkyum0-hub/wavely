export interface HealthRecord {
  id?: number;
  date: string;           // YYYY-MM-DD
  sleepHours?: number;
  sleepQuality?: number;  // 1–5
  exerciseMin?: number;
  waterMl?: number;
  condition?: number;     // 1–5
  waveScore?: number;     // 0–100 (calculated)
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Goal {
  id?: number;
  type: "sleep" | "exercise" | "water" | "wave" | "custom";
  title: string;
  targetValue: number;
  unit?: string;
  period: "daily" | "weekly" | "monthly";
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface ExerciseLog {
  id?: number;
  date: string;
  exerciseName: string;
  durationMin?: number;
  completed: boolean;
  healthRecordId?: number;
  createdAt?: string;
}

export type CognitiveTestType = "reaction" | "digitSpan" | "stroop";

export interface CognitiveTest {
  id?: number;
  date: string;
  testType: CognitiveTestType;
  /** reaction: avg ms · digitSpan: max span reached · stroop: accuracy % */
  metricValue: number;
  /** stroop only: avg reaction time (ms) on correct trials */
  metricValue2?: number;
  createdAt?: string;
}

export function calcWaveScore(r: Partial<HealthRecord>): number {
  const sleep    = Math.min((r.sleepHours ?? 0) / 8, 1) * 100;
  const exercise = Math.min((r.exerciseMin ?? 0) / 30, 1) * 100;
  const water    = Math.min((r.waterMl ?? 0) / 2000, 1) * 100;
  const cond     = ((r.condition ?? 0) / 5) * 100;
  return Math.round(sleep * 0.35 + exercise * 0.30 + water * 0.20 + cond * 0.15);
}
