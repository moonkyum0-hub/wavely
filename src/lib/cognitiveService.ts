import { dbExecute, dbSelect } from "./db";
import type { CognitiveTest, CognitiveTestType } from "./models";

function toTest(row: Record<string, unknown>): CognitiveTest {
  return {
    id:           row.id as number,
    date:         row.date as string,
    testType:     row.test_type as CognitiveTestType,
    metricValue:  row.metric_value as number,
    metricValue2: row.metric_value2 as number | undefined,
    createdAt:    row.created_at as string | undefined,
  };
}

export async function logCognitiveTest(t: Omit<CognitiveTest, "id" | "createdAt">): Promise<void> {
  await dbExecute(
    `INSERT INTO cognitive_tests (date, test_type, metric_value, metric_value2)
     VALUES ($1, $2, $3, $4)`,
    [t.date, t.testType, t.metricValue, t.metricValue2 ?? null],
    "검사 결과 저장에 실패했어요. 다시 시도해주세요."
  );
}

export async function getCognitiveTestsRange(from: string, to: string): Promise<CognitiveTest[]> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM cognitive_tests WHERE date BETWEEN $1 AND $2 ORDER BY date DESC, created_at DESC",
    [from, to]
  );
  return rows.map(toTest);
}

export async function getLatestCognitiveTest(testType: CognitiveTestType): Promise<CognitiveTest | null> {
  const rows = await dbSelect<Record<string, unknown>[]>(
    "SELECT * FROM cognitive_tests WHERE test_type = $1 ORDER BY date DESC, created_at DESC LIMIT 1",
    [testType]
  );
  return rows[0] ? toTest(rows[0]) : null;
}
