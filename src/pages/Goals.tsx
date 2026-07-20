import { useState, useEffect, useCallback } from "react";
import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import EmptyState from "@/components/EmptyState";
import { GoalCardSkeleton } from "@/components/Skeleton";
import { getActiveGoals, createGoal, updateGoal } from "@/lib/goalService";
import { getRecord } from "@/lib/healthService";
import { DEFAULT_GOAL_TEMPLATE } from "@/lib/goalTemplates";
import type { Goal, HealthRecord } from "@/lib/models";

const GOAL_META: Record<Goal["type"], {
  icon: string; color: string; textLight: string; textDark: string; trackLight: string; trackDark: string;
}> = {
  sleep:    { icon: "🌙", color: "bg-violet-500",  textLight: "text-violet-600",  textDark: "text-violet-400",  trackLight: "bg-violet-100",  trackDark: "bg-violet-900/40" },
  exercise: { icon: "🔥", color: "bg-amber-500",   textLight: "text-amber-600",   textDark: "text-amber-400",   trackLight: "bg-amber-100",   trackDark: "bg-amber-900/40" },
  water:    { icon: "💧", color: "bg-emerald-500", textLight: "text-emerald-600", textDark: "text-emerald-400", trackLight: "bg-emerald-100", trackDark: "bg-emerald-900/40" },
  wave:     { icon: "📈", color: "bg-blue-500",    textLight: "text-blue-600",    textDark: "text-blue-400",    trackLight: "bg-blue-100",    trackDark: "bg-blue-900/40" },
  custom:   { icon: "🎯", color: "bg-rose-500",    textLight: "text-rose-600",    textDark: "text-rose-400",    trackLight: "bg-rose-100",    trackDark: "bg-rose-900/40" },
};

function currentValueFor(type: Goal["type"], today: HealthRecord | null): number {
  switch (type) {
    case "sleep":    return today?.sleepHours ?? 0;
    case "exercise": return today?.exerciseMin ?? 0;
    case "water":    return today ? (today.waterMl ?? 0) / 1000 : 0;
    case "wave":     return today?.waveScore ?? 0;
    default:         return 0;
  }
}

function formatValue(type: Goal["type"], value: number) {
  if (type === "water") return value.toFixed(1);
  return String(Math.round(value * 10) / 10);
}

const habits = [
  "기상 후 물 한 잔",
  "점심 후 10분 산책",
  "취침 전 스트레칭",
  "저녁 8시 이후 음식 X",
  "하루 3번 심호흡",
];

export default function Goals() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [checks, setChecks] = useState([true, true, false, false, true]);
  const done = checks.filter(Boolean).length;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [today, setToday] = useState<HealthRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const todayStr = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    try {
      const [g, rec] = await Promise.all([getActiveGoals(), getRecord(todayStr)]);
      setGoals(g);
      setToday(rec);
    } catch {
      // dev browser mode — no Tauri runtime
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  // load는 async — 모든 setState가 await 이후에 일어나므로 동기 setState 아님.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  async function seedDefaultGoals() {
    try {
      for (const g of DEFAULT_GOAL_TEMPLATE) await createGoal(g);
      await load();
    } catch {
      // dev browser mode — no Tauri runtime
    }
  }

  async function editTarget(goal: Goal) {
    const input = window.prompt(`${goal.title} 목표값 (${goal.unit ?? ""})`, String(goal.targetValue));
    if (!input) return;
    const value = parseFloat(input);
    if (Number.isNaN(value) || value <= 0 || value > 1000) {
      window.alert("0보다 크고 1000 이하인 숫자로 입력해주세요.");
      return;
    }
    if (goal.id == null) return;
    try {
      await updateGoal(goal.id, { targetValue: value });
      await load();
    } catch {
      // dev browser mode — no Tauri runtime
    }
  }

  const achievedCount = goals.filter((g) => currentValueFor(g.type, today) >= g.targetValue).length;

  if (isLoading) {
    return (
      <div className="space-y-section">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
          <div className="h-3.5 w-52 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
        </div>
        <div className="space-y-tight">
          {Array.from({ length: 4 }).map((_, i) => <GoalCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-bold text-foreground">목표 설정</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">작은 목표가 큰 변화를 만들어요</p>
        </div>
        <div className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${
          isDark
            ? "bg-amber-900/30 border-amber-700 text-amber-300"
            : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          🏅 {achievedCount} / {goals.length || 0} 달성
        </div>
      </div>

      {/* Goal progress cards */}
      {goals.length === 0 ? (
        <div className="rounded-xl bg-card border border-border/20 shadow-sm">
          <EmptyState
            icon="🎯"
            title="아직 목표가 없어요"
            description="기본 목표 4가지로 시작해봐요"
            action={{ label: "목표 추가하기", onClick: seedDefaultGoals }}
          />
        </div>
      ) : (
        <div className="space-y-tight">
          {goals.map((g) => {
            const meta = GOAL_META[g.type];
            const current = currentValueFor(g.type, today);
            const pct = Math.min(100, Math.round((current / g.targetValue) * 100)) || 0;
            return (
              <div
                key={g.id}
                className="rounded-xl border border-border/20 shadow-sm px-card py-item transition-shadow hover:shadow-md bg-card"
              >
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-xl shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{g.title}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {formatValue(g.type, current)}{g.unit} / {g.targetValue}{g.unit}
                      </span>
                    </div>
                    <div className={`h-2 ${isDark ? meta.trackDark : meta.trackLight} rounded-full overflow-hidden`}>
                      <div className={cn("h-full rounded-full transition-all", meta.color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className={cn("text-sm font-bold shrink-0 w-9 text-right", isDark ? meta.textDark : meta.textLight)}>
                    {pct}%
                  </span>
                  <button onClick={() => editTarget(g)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Habit checklist — local device only, no sync table yet */}
      <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
        <div className={`${isDark ? "bg-black/15" : "bg-gradient-to-r from-emerald-50/80 to-transparent"} px-card pt-section pb-item border-b border-border/50`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-section font-bold text-foreground">오늘의 습관 체크</h3>
              <p className="text-xs text-muted-foreground mt-0.5">작은 습관이 흐름을 만들어요</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              isDark ? "text-emerald-300 bg-emerald-900/40" : "text-emerald-700 bg-emerald-100"
            }`}>
              {done}/{habits.length} 완료
            </span>
          </div>
          <div className={`h-2 ${isDark ? "bg-emerald-900/40" : "bg-emerald-100"} rounded-full overflow-hidden mt-3`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${(done / habits.length) * 100}%` }}
            />
          </div>
        </div>
        <div className="p-item space-y-2">
          {habits.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                const next = [...checks];
                next[i] = !next[i];
                setChecks(next);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-item py-tight rounded-xl border text-left transition-all",
                checks[i]
                  ? isDark
                    ? "border-emerald-700 bg-gradient-to-r from-emerald-900/40 to-transparent"
                    : "border-emerald-200 bg-gradient-to-r from-emerald-50 to-transparent"
                  : "border-border hover:border-muted-foreground/40 bg-card"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                checks[i] ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
              )}>
                {checks[i] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                "text-xs md:text-sm flex-1",
                checks[i] ? (isDark ? "text-foreground font-medium" : "text-emerald-700 font-medium") : "text-foreground"
              )}>
                {h}
              </span>
              {checks[i] && <span className="text-[10px] text-emerald-400 font-medium shrink-0">완료!</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Motivation banner */}
      <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] p-card shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">✦</span>
          <div>
            <p className="text-white font-semibold text-sm mb-1">오늘도 잘 하고 있어요!</p>
            <p className="text-white/65 text-xs leading-relaxed">
              {goals.length > 0
                ? <>목표 {goals.length}개 중 {achievedCount}개를 오늘 달성했어요.<br />남은 목표도 조금씩 채워가요.</>
                : <>목표를 추가하면 오늘의 진행 상황을 여기서 보여드려요.</>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
