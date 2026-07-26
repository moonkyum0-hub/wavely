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

export function calcWaveScore(
  r: Partial<HealthRecord>,
  targets: { sleep: number; exercise: number; water: number }
): number | null {
  const parts: number[] = [];
  if (r.sleepHours != null)  parts.push(Math.min(r.sleepHours / targets.sleep, 1) * 100);
  if (r.exerciseMin != null) parts.push(Math.min(r.exerciseMin / targets.exercise, 1) * 100);
  if (r.waterMl != null)     parts.push(Math.min(r.waterMl / targets.water, 1) * 100);
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}
