# 파도 점수 재설계 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `calcWaveScore`를 고정 절대 기준(수면8h/운동30분/수분2000ml, 35/30/20/15% 가중치) 대신, 사용자의 실제 Goals 목표 대비 달성률의 동일 비중 평균으로 재정의하고, Dashboard/Settings에 그 계산 근거를 짧게 노출한다.

**Architecture:** `calcWaveScore`는 목표값을 파라미터로 받는 순수 함수로 유지한다. 목표값 조회(`getActiveGoals` → `getTargets`)는 호출부(`healthService.upsertRecord`, `Dashboard.tsx`)의 책임으로 분리해 테스트 용이성을 지킨다.

**Tech Stack:** TypeScript, Vitest, React 19, tauri-plugin-sql.

## Global Constraints

- 데이터 정직성: 기록 없는 지표는 0%가 아니라 평균에서 제외. 셋 다 없으면 점수는 `null` → UI에서 "–".
- 완벽주의 방지: 미달성을 빨간색 등으로 강조하지 않음(이 계획엔 해당 UI 변경 없음, 기존 스타일 유지).
- 측정 언어만 사용, 근거 없는 수치를 검증된 것처럼 보이지 않게 함 (Settings 카피에 "의학적으로 검증된 지표가 아니다"라고 명시).
- `npm run check` (tsc+eslint+vitest) 통과가 각 태스크의 완료 조건.
- 커밋은 각 태스크 말미에 스테이징하되, **실제 `git commit` 실행 전 사용자에게 확인**한다 (`CLAUDE.md`: "커밋은 사용자가 요청할 때만"). 이 계획의 커밋 스텝은 "무엇을 커밋할지"의 명세이며, 실행자는 실제 실행 시 사용자 승인 후에만 커밋한다.

참조 설계 문서: `docs/superpowers/specs/2026-07-26-wave-score-redesign-design.md`

---

### Task 1: `goalService`에 목표값 추출 헬퍼 `getTargets` 추가

**Files:**
- Modify: `src/lib/goalService.ts`
- Create: `src/lib/goalService.test.ts`

**Interfaces:**
- Consumes: `Goal` 타입(`src/lib/models.ts`), `DEFAULT_GOAL_TEMPLATE`(`src/lib/goalTemplates.ts`)
- Produces: `export function getTargets(goals: Goal[]): { sleep: number; exercise: number; water: number }` — `water`는 **ml 단위**로 반환(Goal의 water 목표는 L 단위로 저장되어 있음). Task 2, 3, 4가 이 함수를 사용한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/goalService.test.ts` 새로 생성:

```ts
import { describe, it, expect } from "vitest";
import { getTargets } from "./goalService";
import type { Goal } from "./models";

function goal(type: Goal["type"], targetValue: number): Goal {
  return { type, title: "", targetValue, period: "daily", isActive: true };
}

describe("getTargets", () => {
  it("활성 목표가 있으면 그 값을 사용한다 (water는 ml로 변환)", () => {
    const goals = [goal("sleep", 7), goal("exercise", 20), goal("water", 1.5)];
    expect(getTargets(goals)).toEqual({ sleep: 7, exercise: 20, water: 1500 });
  });

  it("특정 목표가 없으면 기본 템플릿 값을 쓴다", () => {
    const goals = [goal("sleep", 7)];
    expect(getTargets(goals)).toEqual({ sleep: 7, exercise: 30, water: 2000 });
  });

  it("활성 목표가 하나도 없으면 전부 기본 템플릿 값", () => {
    expect(getTargets([])).toEqual({ sleep: 8, exercise: 30, water: 2000 });
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test -- goalService`
Expected: FAIL — `getTargets is not exported` 또는 `undefined`

- [ ] **Step 3: 최소 구현 작성**

`src/lib/goalService.ts` 최상단 import 옆에 추가 (기존 `import { Goal } from "./models";` 아래):

```ts
import { DEFAULT_GOAL_TEMPLATE } from "./goalTemplates";
```

파일 끝(`deleteGoal` 함수 뒤)에 추가:

```ts
export function getTargets(goals: Goal[]): { sleep: number; exercise: number; water: number } {
  const defaults = {
    sleep:    DEFAULT_GOAL_TEMPLATE.find((g) => g.type === "sleep")!.targetValue,
    exercise: DEFAULT_GOAL_TEMPLATE.find((g) => g.type === "exercise")!.targetValue,
    water:    DEFAULT_GOAL_TEMPLATE.find((g) => g.type === "water")!.targetValue,
  };
  const find = (type: Goal["type"], fallback: number) =>
    goals.find((g) => g.type === type)?.targetValue ?? fallback;
  return {
    sleep:    find("sleep", defaults.sleep),
    exercise: find("exercise", defaults.exercise),
    water:    find("water", defaults.water) * 1000,
  };
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test -- goalService`
Expected: PASS (3 tests)

- [ ] **Step 5: 스테이징 (커밋은 사용자 확인 후)**

```bash
git add src/lib/goalService.ts src/lib/goalService.test.ts
```

---

### Task 2: `calcWaveScore`를 목표 대비 달성률 평균으로 재정의

**Files:**
- Modify: `src/lib/models.ts:51-56`
- Modify: `src/lib/models.test.ts` (전체 재작성)

**Interfaces:**
- Consumes: 없음 (순수 함수, 새 시그니처)
- Produces: `export function calcWaveScore(r: Partial<HealthRecord>, targets: { sleep: number; exercise: number; water: number }): number | null` — Task 3(`healthService.upsertRecord`)이 이 시그니처로 호출한다.

- [ ] **Step 1: 실패하는 테스트로 전체 교체**

`src/lib/models.test.ts` 전체를 아래로 교체:

```ts
import { describe, it, expect } from "vitest";
import { calcWaveScore } from "./models";

const T = { sleep: 8, exercise: 30, water: 2000 };

describe("calcWaveScore", () => {
  it("세 지표 모두 목표치를 채우면 100점", () => {
    expect(calcWaveScore({ sleepHours: 8, exerciseMin: 30, waterMl: 2000 }, T)).toBe(100);
  });

  it("기록이 하나도 없으면 null (데이터 정직성 — 0점 아님)", () => {
    expect(calcWaveScore({}, T)).toBeNull();
  });

  it("컨디션만 기록해도 null (컨디션은 점수에 반영되지 않음)", () => {
    expect(calcWaveScore({ condition: 5 }, T)).toBeNull();
  });

  it("목표치를 초과해도 100점을 넘지 않는다", () => {
    expect(calcWaveScore({ sleepHours: 12, exerciseMin: 120, waterMl: 5000 }, T)).toBe(100);
  });

  it("한 지표만 있으면 그 지표만으로 평균낸다 (동일 비중, 부분 기록 허용)", () => {
    expect(calcWaveScore({ exerciseMin: 30 }, T)).toBe(100);
    expect(calcWaveScore({ exerciseMin: 15 }, T)).toBe(50);
  });

  it("세 지표가 각각 절반 수준이면 평균도 50점", () => {
    expect(calcWaveScore({ sleepHours: 4, exerciseMin: 15, waterMl: 1000 }, T)).toBe(50);
  });

  it("목표치가 사용자마다 다르면 그 목표 기준으로 계산된다", () => {
    expect(calcWaveScore({ sleepHours: 6 }, { sleep: 6, exercise: 30, water: 2000 })).toBe(100);
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm run test -- models`
Expected: FAIL (타입 에러 — `calcWaveScore` 두 번째 인자 없음, 또는 값 불일치)

- [ ] **Step 3: 최소 구현으로 교체**

`src/lib/models.ts:51-56`의 기존 `calcWaveScore` 함수를 아래로 교체:

```ts
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
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm run test -- models`
Expected: PASS (7 tests)

- [ ] **Step 5: 스테이징**

```bash
git add src/lib/models.ts src/lib/models.test.ts
```

---

### Task 3: `healthService.upsertRecord`가 실제 목표값을 조회해서 사용하도록 연결

**Files:**
- Modify: `src/lib/healthService.ts:1-21`

**Interfaces:**
- Consumes: `getActiveGoals()`(`src/lib/goalService.ts`, 기존), `getTargets(goals)`(Task 1에서 추가), `calcWaveScore(r, targets)`(Task 2, 새 시그니처)
- Produces: `upsertRecord`의 외부 시그니처(`(r: HealthRecord) => Promise<void>`)는 변경 없음 — Task 5(HealthRecord.tsx 등 기존 호출부)는 수정 불필요.

이 태스크는 순수 로직이 아니라 DB I/O라 `CLAUDE.md` 테스트 정책상 유닛 테스트 대상이 아니다. 대신 Task 6에서 실제 Tauri 앱으로 동작을 검증한다.

- [ ] **Step 1: import 추가**

`src/lib/healthService.ts:1-2`를 아래로 교체:

```ts
import { dbExecute, dbSelect } from "./db";
import { HealthRecord, calcWaveScore } from "./models";
import { getActiveGoals, getTargets } from "./goalService";
```

- [ ] **Step 2: `upsertRecord` 내부에서 목표 조회 후 계산**

`src/lib/healthService.ts:20-21` (현재 `export async function upsertRecord(r: HealthRecord): Promise<void> {` 다음 줄 `const score = calcWaveScore(r);`)를 아래로 교체:

```ts
export async function upsertRecord(r: HealthRecord): Promise<void> {
  const targets = getTargets(await getActiveGoals());
  const score = calcWaveScore(r, targets);
```

(이후 `const now = new Date().toISOString();` 이하는 그대로 유지 — `score`가 `number | null`이 되어도 `dbExecute`의 파라미터 배열에 그대로 들어가면 SQLite가 `NULL`로 저장한다.)

- [ ] **Step 3: 타입체크로 확인**

Run: `npm run check`
Expected: `tsc --noEmit`, `lint`, `test` 전부 통과 (기존 13+10개 테스트 그대로 통과, healthService 자체는 새 테스트 없음 — DB I/O라 정책상 제외)

- [ ] **Step 4: 스테이징**

```bash
git add src/lib/healthService.ts
```

---

### Task 4: Dashboard — 목표값을 반영한 breakdown + 캡션 추가

**Files:**
- Modify: `src/pages/Dashboard.tsx:10-11` (import), `:32-39` (`subScores`), `:55-66` 근처(목표 조회 effect 추가), `:89-94`(`stats` 배열), `:168`(`todaySub` 호출), `:250-266`(stat 카드 렌더)

**Interfaces:**
- Consumes: `getActiveGoals()`, `getTargets(goals)`(`src/lib/goalService.ts`)
- Produces: 없음 (페이지 컴포넌트, 최종 소비자)

- [ ] **Step 1: import 추가**

`src/pages/Dashboard.tsx:10`의 `import { getRecentRecords } from "@/lib/healthService";` 다음 줄에 추가:

```ts
import { getActiveGoals, getTargets } from "@/lib/goalService";
```

- [ ] **Step 2: `subScores`가 목표값을 파라미터로 받도록 수정**

`src/pages/Dashboard.tsx:32-39`를 아래로 교체:

```ts
function subScores(r: HealthRecord, targets: { sleep: number; exercise: number; water: number }) {
  return {
    sleep:     Math.round(Math.min((r.sleepHours ?? 0) / targets.sleep, 1) * 100),
    exercise:  Math.round(Math.min((r.exerciseMin ?? 0) / targets.exercise, 1) * 100),
    water:     Math.round(Math.min((r.waterMl ?? 0) / targets.water, 1) * 100),
    condition: Math.round(((r.condition ?? 0) / 5) * 100),
  };
}
```

- [ ] **Step 3: 목표값을 불러오는 state/effect 추가**

`src/pages/Dashboard.tsx:51` 근처, `const [activeTab, setActiveTab] = useState<TabKey>("wave");` 다음 줄에 추가:

```ts
  const [targets, setTargets] = useState({ sleep: 8, exercise: 30, water: 2000 });
```

`src/pages/Dashboard.tsx:55-66`의 기존 `useEffect`(레코드 로딩) 바로 뒤에 새 effect 추가:

```ts
  useEffect(() => {
    (async () => {
      try {
        setTargets(getTargets(await getActiveGoals()));
      } catch {
        // dev browser mode — no Tauri runtime, keep defaults
      }
    })();
  }, []);
```

- [ ] **Step 4: `todaySub` 호출에 targets 전달**

`src/pages/Dashboard.tsx:168`의 `const todaySub = todayRecord ? subScores(todayRecord) : null;`를 아래로 교체:

```ts
  const todaySub = todayRecord ? subScores(todayRecord, targets) : null;
```

- [ ] **Step 5: "오늘의 파도" 스탯 카드에 캡션 추가**

`src/pages/Dashboard.tsx:89-94`의 `stats` 배열 첫 항목을 아래로 교체:

```ts
  const stats = [
    {
      label: "오늘의 파도", value: todayRecord?.waveScore != null ? String(todayRecord.waveScore) : "–", unit: todayRecord ? "점" : "",
      sub: waveSub,
      caption: "수면·운동·수분, 내 목표 대비 평균",
      icon: TrendingUp, iconColor: "text-blue-400", lightBg: "from-blue-50 to-white", darkBg: "from-blue-900/50 to-transparent",
    },
```

`src/pages/Dashboard.tsx:250-266`의 stat 카드 렌더 부분을 아래로 교체:

```tsx
        {stats.map(({ label, value, unit, sub, caption, icon: Icon, iconColor, lightBg }) => (
          <div
            key={label}
            className={`rounded-xl border border-border/20 shadow-sm p-card transition-shadow hover:shadow-md ${
              ct.isDark ? "bg-card" : `bg-gradient-to-br ${lightBg}`
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon className={`w-4 h-4 ${iconColor}`} />
            </div>
            <div className="text-display font-bold text-foreground">
              {value}<span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
            </div>
            <p className="text-[11px] mt-2 font-medium text-muted-foreground">{sub}</p>
            {caption && <p className="text-[10px] mt-1 text-muted-foreground/70">{caption}</p>}
          </div>
        ))}
```

- [ ] **Step 6: 확인**

Run: `npm run check`
Expected: 통과. (이 컴포넌트 자체는 페이지라 유닛 테스트 대상 아님 — Task 6에서 실제 앱으로 시각 확인)

- [ ] **Step 7: 스테이징**

```bash
git add src/pages/Dashboard.tsx
```

---

### Task 5: Settings — "파도 점수란?" 정보 카드 추가

**Files:**
- Modify: `src/pages/Settings.tsx:242` 이후 (`{/* Persona / user type */}` 카드와 `{/* Other settings sections */}` 사이)

**Interfaces:**
- Consumes: 없음 (정적 카드, 기존 `isDark` 변수 재사용)
- Produces: 없음

- [ ] **Step 1: 카드 삽입**

`src/pages/Settings.tsx:242`의 `</div>` (Persona 카드를 닫는 태그) 바로 다음, `{/* Other settings sections */}` 주석 바로 앞에 삽입:

```tsx
      {/* Wave score explainer */}
      <div className="rounded-xl border border-border/20 shadow-sm overflow-hidden">
        <div className={`${isDark ? "bg-black/15" : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent"} px-card pt-section pb-item border-b border-border/50`}>
          <h3 className="text-section font-bold text-foreground">파도 점수란?</h3>
        </div>
        <div className="bg-card px-card py-section">
          <p className="text-xs text-muted-foreground leading-relaxed">
            수면·운동·수분, 내가 설정한 목표 대비 오늘 달성률의 평균이에요. 의학적으로 검증된 지표가
            아니라 내 목표 기준으로 흐름을 보는 참고용 숫자예요. 목표는 목표 설정에서 언제든 바꿀 수 있어요.
          </p>
        </div>
      </div>

```

- [ ] **Step 2: 확인**

Run: `npm run check`
Expected: 통과

- [ ] **Step 3: 스테이징**

```bash
git add src/pages/Settings.tsx
```

---

### Task 6: 전체 검증 + 커밋

**Files:** 없음 (검증 전용 태스크)

**Interfaces:** 없음

- [ ] **Step 1: 전체 품질 게이트 실행**

Run: `npm run check`
Expected: tsc/eslint/vitest 전부 통과 (Task 1~5의 테스트 포함 전체)

- [ ] **Step 2: 실제 Tauri 앱에서 수동 검증**

`npm run tauri dev`로 실제 앱 창 실행 → "건강 기록"에서 오늘 기록 저장 → Dashboard에서:
- "오늘의 파도" 카드 아래 "수면·운동·수분, 내 목표 대비 평균" 캡션이 보이는지
- 값이 새 공식(목표 대비 평균)대로 계산됐는지 (예: Goals에서 설정한 목표와 비교)
설정 페이지에서 "파도 점수란?" 카드가 "내 유형" 카드 아래에 보이는지 확인.

- [ ] **Step 3: 콘솔 에러 확인**

수동 검증 중 개발자 도구/터미널에 새로 발생한 에러가 없는지 확인 (Tauri 미실행 상태의 "invoke" 에러는 기존에도 있던 것이라 무관).

- [ ] **Step 4: 커밋 (사용자 승인 후 실행)**

사용자에게 "커밋할까요?"로 확인 후:

```bash
git add docs/superpowers/specs/2026-07-26-wave-score-redesign-design.md docs/superpowers/plans/2026-07-26-wave-score-redesign.md
git commit -m "$(cat <<'EOF'
feat: redefine wave score as goal-relative achievement rate instead of arbitrary fixed weights

기존 공식(수면35%+운동30%+수분20%+컨디션15%, 절대 목표치)은 어떤 연구나 표준에도
근거가 없어 데이터 정직성 원칙에 위배됐다. 사용자가 실제 설정한 목표 대비 달성률의
동일 비중 평균으로 바꿔 "왜 이 숫자인지" 설명 가능하게 하고, Settings/Dashboard에
그 근거를 짧게 노출한다.
EOF
)"
```

---

## Self-Review Notes

- **Spec coverage:** 공식(Task 2) / 데이터 흐름(Task 1, 3) / Goals "파도 점수" 항목(변경 없음, 설계서에 명시) / UI 카피(Task 4, 5) / 기존 레코드 미재계산(Task 3에서 새 레코드에만 적용, 과거 데이터 그대로 둠 — 별도 마이그레이션 태스크 없음, 설계 의도대로) 모두 태스크로 커버됨.
- **Placeholder scan:** 없음 — 모든 스텝에 실제 코드/명령어 포함.
- **Type consistency:** `getTargets`(Task 1) → `calcWaveScore`의 `targets` 파라미터(Task 2) → `healthService`(Task 3)·`Dashboard.subScores`(Task 4)에서 동일한 `{ sleep, exercise, water }` 형태(water=ml)로 일관되게 사용됨.
