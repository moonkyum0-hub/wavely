import { useState, useEffect, useMemo } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { getRecords } from "@/lib/healthService";
import { getExerciseLogsRange } from "@/lib/exerciseService";
import { EXERCISES, type ExerciseCategory } from "@/lib/exerciseData";
import { BODY_FUNCTIONS, type BodyFunction } from "@/lib/bodyFunctions";
import type { HealthRecord, ExerciseLog } from "@/lib/models";

const FUNCTION_ICON: Record<string, string> = {
  strength: "💪",
  cardio: "❤️",
  flexibility: "🤸",
  metabolism: "🔥",
  sleepRecovery: "🌙",
  stressResilience: "🕊️",
  brainFocus: "🧠",
};

type Period = "week" | "month" | "all";
const PERIOD_LABEL: Record<Period, string> = { week: "이번 주", month: "이번 달", all: "전체" };

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function periodRange(period: Period): { from: string; to: string } {
  const to = toDateStr(new Date());
  if (period === "all") return { from: "2000-01-01", to };
  const days = period === "week" ? 7 : 28;
  const from = toDateStr(new Date(Date.now() - (days - 1) * 86400000));
  return { from, to };
}

interface FunctionStat {
  exerciseCount?: number;
  avgSleepHours?: number;
  avgWaterL?: number;
  avgCondition?: number;
  hasAnyData: boolean;
}

function computeStat(
  fn: BodyFunction,
  exerciseLogs: ExerciseLog[],
  records: HealthRecord[],
  nameToCategory: Map<string, ExerciseCategory>
): FunctionStat {
  let exerciseCount: number | undefined;
  if (fn.exerciseCategories) {
    exerciseCount = exerciseLogs.filter(
      (l) => l.completed && fn.exerciseCategories!.includes(nameToCategory.get(l.exerciseName) as ExerciseCategory)
    ).length;
  }

  const avg = (vals: number[]) => (vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : undefined);

  const avgSleepHours = fn.usesSleep ? avg(records.map((r) => r.sleepHours).filter((v): v is number => v != null)) : undefined;
  const avgWaterMl = fn.usesWater ? avg(records.map((r) => r.waterMl).filter((v): v is number => v != null)) : undefined;
  const avgWaterL = avgWaterMl != null ? Math.round(avgWaterMl) / 1000 : undefined;
  const avgCondition = fn.usesCondition ? avg(records.map((r) => r.condition).filter((v): v is number => v != null)) : undefined;

  const hasAnyData = (exerciseCount ?? 0) > 0 || avgSleepHours != null || avgWaterL != null || avgCondition != null;
  return { exerciseCount, avgSleepHours, avgWaterL, avgCondition, hasAnyData };
}

function statParts(periodLabel: string, s: FunctionStat): string[] {
  const parts: string[] = [];
  if (s.exerciseCount != null) parts.push(`${periodLabel} ${s.exerciseCount}회 활동`);
  if (s.avgSleepHours != null) parts.push(`평균 수면 ${s.avgSleepHours}h`);
  if (s.avgWaterL != null) parts.push(`평균 수분 ${s.avgWaterL.toFixed(1)}L`);
  if (s.avgCondition != null) parts.push(`평균 컨디션 ${s.avgCondition}/5`);
  return parts;
}

export default function BodyMap() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [period, setPeriod] = useState<Period>("week");
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const nameToCategory = useMemo(() => {
    const map = new Map<string, ExerciseCategory>();
    EXERCISES.forEach((ex) => map.set(ex.name, ex.category));
    return map;
  }, []);

  useEffect(() => {
    const { from, to } = periodRange(period);
    setIsLoading(true);
    (async () => {
      try {
        const [recs, logs] = await Promise.all([getRecords(from, to), getExerciseLogsRange(from, to)]);
        setRecords(recs);
        setExerciseLogs(logs);
      } catch {
        // dev browser mode — no Tauri runtime
      } finally {
        setIsLoading(false);
      }
    })();
  }, [period]);

  return (
    <div className="space-y-section max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-bold text-foreground">신체 지도</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">기록이 쌓일수록 몸의 기능이 드러나요</p>
        </div>
        <div className="flex gap-1.5 shrink-0 bg-muted rounded-lg p-1">
          {(["week", "month", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                period === p
                  ? isDark ? "bg-card shadow-sm text-foreground" : "bg-card shadow-sm text-[#1e3a8a]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIOD_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-item">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/20 shadow-sm p-card bg-card h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-item">
          {BODY_FUNCTIONS.map((fn) => {
            if (fn.status === "locked") {
              return (
                <div
                  key={fn.id}
                  className={cn(
                    "rounded-xl border border-border/20 p-card flex items-start gap-3",
                    isDark ? "bg-card/50" : "bg-slate-50"
                  )}
                >
                  <span className="text-xl shrink-0 opacity-40">{FUNCTION_ICON[fn.id] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm font-semibold text-muted-foreground">{fn.label}</span>
                      <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        <Lock className="w-2.5 h-2.5" /> 준비중
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{fn.blurb}</p>
                  </div>
                </div>
              );
            }

            const stat = computeStat(fn, exerciseLogs, records, nameToCategory);
            const parts = statParts(PERIOD_LABEL[period], stat);

            return (
              <div key={fn.id} className="rounded-xl border border-border/20 shadow-sm p-card bg-card">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">{FUNCTION_ICON[fn.id] ?? "•"}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground">{fn.label}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">{fn.blurb}</p>
                    {stat.hasAnyData ? (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {parts.map((p) => (
                          <span
                            key={p}
                            className={cn(
                              "text-[11px] font-medium px-2 py-1 rounded-full",
                              isDark ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-[#1e3a8a]"
                            )}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70 mt-2.5">아직 기록이 없어요</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
