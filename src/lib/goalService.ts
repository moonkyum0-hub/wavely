import { dbExecute, dbSelect } from "./db";
import { Goal } from "./models";

function toGoal(row: Record<string, unknown>): Goal {
  return {
    id:          row.id as number,
    type:        row.type as Goal["type"],
    title:       row.title as string,
    targetValue: row.target_value as number,
    unit:        row.unit as string | undefined,
    period:      row.period as Goal["period"],
    startDate:   row.start_date as string | undefined,
    endDate:     row.end_date as string | undefined,
    isActive:    Boolean(row.is_active),
    createdAt:   row.created_at as string | undefined,
  };
}

export async function createGoal(g: Omit<Goal, "id" | "createdAt">): Promise<void> {
  await dbExecute(
    `INSERT INTO goals (type, title, target_value, unit, period, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [g.type, g.title, g.targetValue, g.unit ?? null,
     g.period, g.startDate ?? null, g.endDate ?? null, g.isActive ? 1 : 0],
    "목표 추가에 실패했어요. 다시 시도해주세요."
  );
}

export async function getActiveGoals(): Promise<Goal[]> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM goals WHERE is_active = 1 ORDER BY created_at DESC"
  );
  return rows.map(toGoal);
}

export async function updateGoal(id: number, updates: Partial<Goal>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (updates.title       !== undefined) { fields.push(`title = $${i++}`);        values.push(updates.title); }
  if (updates.targetValue !== undefined) { fields.push(`target_value = $${i++}`); values.push(updates.targetValue); }
  if (updates.isActive    !== undefined) { fields.push(`is_active = $${i++}`);    values.push(updates.isActive ? 1 : 0); }
  if (updates.endDate     !== undefined) { fields.push(`end_date = $${i++}`);     values.push(updates.endDate); }
  if (!fields.length) return;
  values.push(id);
  await dbExecute(
    `UPDATE goals SET ${fields.join(", ")} WHERE id = $${i}`,
    values,
    "목표 수정에 실패했어요. 다시 시도해주세요."
  );
}

export async function deleteGoal(id: number): Promise<void> {
  await dbExecute("DELETE FROM goals WHERE id = $1", [id], "목표 삭제에 실패했어요. 다시 시도해주세요.");
}
