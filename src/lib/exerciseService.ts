import { dbExecute, dbSelect } from "./db";
import { ExerciseLog } from "./models";

function toLog(row: Record<string, unknown>): ExerciseLog {
  return {
    id:             row.id as number,
    date:           row.date as string,
    exerciseName:   row.exercise_name as string,
    durationMin:    row.duration_min as number | undefined,
    completed:      Boolean(row.completed),
    healthRecordId: row.health_record_id as number | undefined,
    createdAt:      row.created_at as string | undefined,
  };
}

export async function logExercise(log: Omit<ExerciseLog, "id" | "createdAt">): Promise<void> {
  await dbExecute(
    `INSERT INTO exercise_logs (date, exercise_name, duration_min, completed, health_record_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [log.date, log.exerciseName, log.durationMin ?? null,
     log.completed ? 1 : 0, log.healthRecordId ?? null],
    "운동 기록 저장에 실패했어요. 다시 시도해주세요."
  );
}

export async function getExerciseLogs(date: string): Promise<ExerciseLog[]> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM exercise_logs WHERE date = $1 ORDER BY created_at ASC", [date]
  );
  return rows.map(toLog);
}

export async function getExerciseLogsRange(from: string, to: string): Promise<ExerciseLog[]> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM exercise_logs WHERE date BETWEEN $1 AND $2 ORDER BY date DESC", [from, to]
  );
  return rows.map(toLog);
}

export async function getTotalMinutesByDate(date: string): Promise<number> {
  const rows = await dbSelect<{ total: number }[]>(
    "SELECT COALESCE(SUM(duration_min), 0) as total FROM exercise_logs WHERE date = $1 AND completed = 1",
    [date]
  );
  return rows[0]?.total ?? 0;
}

export async function deleteExerciseLog(id: number): Promise<void> {
  await dbExecute("DELETE FROM exercise_logs WHERE id = $1", [id], "운동 기록 삭제에 실패했어요. 다시 시도해주세요.");
}
