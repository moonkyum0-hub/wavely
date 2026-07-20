import { dbExecute, dbSelect } from "./db";
import { HealthRecord, calcWaveScore } from "./models";

function toRecord(row: Record<string, unknown>): HealthRecord {
  return {
    id:           row.id as number,
    date:         row.date as string,
    sleepHours:   row.sleep_hours as number | undefined,
    sleepQuality: row.sleep_quality as number | undefined,
    exerciseMin:  row.exercise_min as number | undefined,
    waterMl:      row.water_ml as number | undefined,
    condition:    row.condition as number | undefined,
    waveScore:    row.wave_score as number | undefined,
    note:         row.note as string | undefined,
    createdAt:    row.created_at as string | undefined,
    updatedAt:    row.updated_at as string | undefined,
  };
}

export async function upsertRecord(r: HealthRecord): Promise<void> {
  const score = calcWaveScore(r);
  const now = new Date().toISOString();
  await dbExecute(
    `INSERT INTO health_records (date, sleep_hours, sleep_quality, exercise_min, water_ml, condition, wave_score, note, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
     ON CONFLICT(date) DO UPDATE SET
       sleep_hours = excluded.sleep_hours,
       sleep_quality = excluded.sleep_quality,
       exercise_min = excluded.exercise_min,
       water_ml = excluded.water_ml,
       condition = excluded.condition,
       wave_score = excluded.wave_score,
       note = excluded.note,
       updated_at = excluded.updated_at`,
    [r.date, r.sleepHours ?? null, r.sleepQuality ?? null,
     r.exerciseMin ?? null, r.waterMl ?? null, r.condition ?? null,
     score, r.note ?? null, now],
    "오늘의 기록 저장에 실패했어요. 다시 시도해주세요."
  );
}

export async function getRecord(date: string): Promise<HealthRecord | null> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM health_records WHERE date = $1 LIMIT 1", [date]
  );
  return rows[0] ? toRecord(rows[0]) : null;
}

export async function getRecords(from: string, to: string): Promise<HealthRecord[]> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM health_records WHERE date BETWEEN $1 AND $2 ORDER BY date DESC",
    [from, to]
  );
  return rows.map(toRecord);
}

export async function deleteRecord(id: number): Promise<void> {
  await dbExecute("DELETE FROM health_records WHERE id = $1", [id], "기록 삭제에 실패했어요. 다시 시도해주세요.");
}

export async function getRecentRecords(days = 7): Promise<HealthRecord[]> {
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  return getRecords(from, to);
}
