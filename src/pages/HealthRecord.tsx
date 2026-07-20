"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Zap, Star, ChevronRight, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import EmptyState from "@/components/EmptyState";
import { LogItemSkeleton } from "@/components/Skeleton";
import { upsertRecord, getRecord, getRecentRecords } from "@/lib/healthService";
import { calcWaveScore, type HealthRecord } from "@/lib/models";

const CONDITIONS = [
  { label: "힘들어요", emoji: "😞", value: 1,
    activeLightBorder: "border-slate-400", activeLightBg: "bg-slate-100",
    activeDarkBorder:  "border-[#3d6080]", activeDarkBg:  "bg-[#1a2d42]/70" },
  { label: "보통이에요", emoji: "😐", value: 3,
    activeLightBorder: "border-amber-400", activeLightBg: "bg-amber-50",
    activeDarkBorder:  "border-amber-500", activeDarkBg:  "bg-amber-900/40" },
  { label: "좋아요", emoji: "😊", value: 5,
    activeLightBorder: "border-emerald-400", activeLightBg: "bg-emerald-50",
    activeDarkBorder:  "border-emerald-500", activeDarkBg:  "bg-emerald-900/40" },
];

function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function waveEmoji(score: number) {
  if (score >= 70) return "😊";
  if (score >= 40) return "😐";
  return "😞";
}

function scoreTags(r: HealthRecord) {
  const tags: string[] = [];
  if (r.sleepHours)  tags.push(`수면 ${r.sleepHours}h`);
  if (r.exerciseMin) tags.push(`운동 ${r.exerciseMin}분`);
  if (r.waterMl)     tags.push(`수분 ${(r.waterMl / 1000).toFixed(1)}L`);
  return tags;
}

const FIELD_MAX: Record<"sleep" | "exercise" | "water", number> = { sleep: 24, exercise: 600, water: 10 };
const FIELD_UNIT: Record<"sleep" | "exercise" | "water", string> = { sleep: "시간", exercise: "분", water: "L" };

function validateField(key: "sleep" | "exercise" | "water", value: string): string | undefined {
  if (!value) return undefined;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "숫자로 입력해주세요";
  if (num < 0) return "0 이상으로 입력해주세요";
  if (num > FIELD_MAX[key]) return `${FIELD_MAX[key]}${FIELD_UNIT[key]} 이하로 입력해주세요`;
  return undefined;
}

export default function HealthRecord() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const today  = toDateStr();

  const [tab,       setTab]       = useState<"quick" | "detail">("quick");
  const [condition, setCondition] = useState(3);
  const [sleep,     setSleep]     = useState("");
  const [exercise,  setExercise]  = useState("");
  const [water,     setWater]     = useState("");
  const [note,      setNote]      = useState("");

  const sleepError    = validateField("sleep", sleep);
  const exerciseError = validateField("exercise", exercise);
  const waterError    = validateField("water", water);
  const hasErrors = !!(sleepError || exerciseError || waterError);

  const [isSaving,    setIsSaving]    = useState(false);
  const [savedScore,  setSavedScore]  = useState<number | null>(null);
  const [recentLogs,  setRecentLogs]  = useState<HealthRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const loadRecent = useCallback(async () => {
    try {
      const logs = await getRecentRecords(7);
      setRecentLogs(logs);
    } catch {
      // dev browser mode — no Tauri runtime
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Pre-fill today's record if it exists
  useEffect(() => {
    (async () => {
      try {
        const rec = await getRecord(today);
        if (rec) {
          if (rec.condition)   setCondition(rec.condition);
          if (rec.sleepHours)  setSleep(String(rec.sleepHours));
          if (rec.exerciseMin) setExercise(String(rec.exerciseMin));
          if (rec.waterMl)     setWater(String(rec.waterMl / 1000));
          if (rec.note)        setNote(rec.note);
          if (rec.waveScore != null) setSavedScore(rec.waveScore);
        }
      } catch { /* browser dev */ }
    })();
    loadRecent();
  }, [today, loadRecent]);

  async function handleSave() {
    if (hasErrors) return;
    setIsSaving(true);
    try {
      const record: HealthRecord = {
        date:        today,
        condition,
        sleepHours:  sleep    ? parseFloat(sleep)    : undefined,
        exerciseMin: exercise ? parseInt(exercise)   : undefined,
        waterMl:     water    ? Math.round(parseFloat(water) * 1000) : undefined,
        note:        note || undefined,
      };
      const score = calcWaveScore(record);
      await upsertRecord(record);
      setSavedScore(score);
      await loadRecent();
    } catch (e) {
      console.error("저장 실패:", e);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-section max-w-2xl">
      <div>
        <h1 className="text-page font-bold text-foreground">오늘의 건강 기록</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">매일 기록하는 것 자체가 이미 성장이에요</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-muted/60 p-1 rounded-xl w-fit">
        {([
          { key: "quick",  icon: Zap,  label: "빠른 기록" },
          { key: "detail", icon: Star, label: "상세 기록" },
        ] as const).map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              tab === key
                ? isDark ? "bg-card text-teal-300 shadow-sm" : "bg-white shadow-sm text-[#059669]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className={cn("rounded-xl border border-border/20 shadow-sm overflow-hidden", isDark ? "bg-card" : "")}>
        <div className={cn(
          "px-card pt-section pb-item border-b border-border/50",
          isDark ? "bg-black/15" : "bg-gradient-to-r from-teal-50/80 to-transparent"
        )}>
          <h3 className="text-section font-bold text-foreground">오늘 건강 체크</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {today} · {tab === "quick" ? "컨디션 + 3가지 핵심 지표" : "상세 기록 모드"}
          </p>
        </div>

        <div className="bg-card px-card py-card space-y-6">
          {/* Condition */}
          <div>
            <p className={cn("text-label font-semibold uppercase mb-3", isDark ? "text-blue-300/80" : "text-muted-foreground")}>
              오늘 컨디션은?
            </p>
            <div className="grid grid-cols-3 gap-item">
              {CONDITIONS.map((c) => {
                const isActive = condition === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setCondition(c.value)}
                    className={cn(
                      "py-4 md:py-5 rounded-xl border-2 text-center transition-all",
                      isActive
                        ? cn(isDark ? c.activeDarkBorder : c.activeLightBorder,
                             isDark ? c.activeDarkBg    : c.activeLightBg, "shadow-sm")
                        : "border-border hover:border-muted-foreground/40 bg-card"
                    )}
                  >
                    <div className="text-2xl md:text-3xl mb-1">{c.emoji}</div>
                    <div className={cn("text-xs md:text-sm", isActive ? "font-semibold text-foreground" : "text-muted-foreground")}>
                      {c.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div>
            <p className={cn("text-label font-semibold uppercase mb-3", isDark ? "text-blue-300/80" : "text-muted-foreground")}>
              측정값 입력
            </p>
            <div className="grid grid-cols-3 gap-item">
              {[
                { label: "수면 시간", icon: "🌙", unit: "h",  placeholder: "7.5",  value: sleep,    set: setSleep,    type: "number", step: "0.5", error: sleepError },
                { label: "운동 시간", icon: "🏃", unit: "분", placeholder: "30",   value: exercise, set: setExercise, type: "number", step: "1",   error: exerciseError },
                { label: "수분 섭취", icon: "💧", unit: "L",  placeholder: "1.8",  value: water,    set: setWater,    type: "number", step: "0.1", error: waterError },
              ].map((f) => (
                <div key={f.label} className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                    <span>{f.icon}</span> {f.label}
                  </label>
                  <div className="relative">
                    <Input
                      type={f.type}
                      step={f.step}
                      min="0"
                      placeholder={f.placeholder}
                      value={f.value}
                      onChange={(e) => f.set(e.target.value)}
                      className={cn(
                        "bg-muted/50 border-border/20 focus-visible:ring-1 text-sm pr-7",
                        f.error && "border-rose-400 focus-visible:ring-rose-400"
                      )}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">
                      {f.unit}
                    </span>
                  </div>
                  {f.error && <p className="text-[11px] text-rose-500">{f.error}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Note — detail mode only */}
          {tab === "detail" && (
            <div>
              <p className={cn("text-label font-semibold uppercase mb-2", isDark ? "text-blue-300/80" : "text-muted-foreground")}>
                메모
              </p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="오늘 특별한 점이 있었나요?"
                rows={3}
                className={cn(
                  "w-full rounded-lg border border-border/20 text-sm px-3 py-2.5 resize-none outline-none",
                  "bg-muted/50 text-foreground placeholder:text-muted-foreground",
                  "focus:ring-1 focus:ring-ring/40"
                )}
              />
            </div>
          )}

          {/* Saved score banner */}
          {savedScore !== null && (
            <div className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
              isDark ? "bg-teal-900/40 border border-teal-700/40 text-teal-300"
                     : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            )}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>저장 완료! 오늘의 파도 점수 <strong>{savedScore}점</strong></span>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving || hasErrors}
            className={cn(
              "w-full h-11 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center justify-center gap-2",
              (isSaving || hasErrors) ? "opacity-60 cursor-not-allowed" : "",
              isDark ? "bg-teal-600 hover:bg-teal-500 text-white" : "bg-[#059669] hover:bg-[#059669]/90 text-white"
            )}
          >
            <Zap className="w-4 h-4" />
            {isSaving ? "저장 중..." : "오늘 기록 저장하기"}
          </button>
        </div>
      </div>

      {/* Recent records */}
      <div className={cn("rounded-xl border border-border/20 shadow-sm overflow-hidden", isDark ? "bg-card" : "")}>
        <div className={cn(
          "px-card pt-section pb-item border-b border-border/50 flex items-center justify-between",
          isDark ? "bg-black/15" : "bg-gradient-to-r from-slate-50/80 to-transparent"
        )}>
          <div>
            <h3 className="text-section font-bold text-foreground">최근 기록</h3>
            <p className="text-xs text-muted-foreground mt-0.5">지난 7일</p>
          </div>
          <button className={cn("text-xs font-medium flex items-center gap-0.5", isDark ? "text-blue-400 hover:text-blue-300" : "text-blue-500 hover:text-blue-600")}>
            전체 보기 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="bg-card">
          {isLoadingLogs ? (
            <div className="divide-y divide-border/50">
              {Array.from({ length: 2 }).map((_, i) => <LogItemSkeleton key={i} />)}
            </div>
          ) : recentLogs.length === 0 ? (
            <EmptyState icon="📋" title="아직 기록이 없어요" description="첫 기록을 남기면 여기서 확인할 수 있어요" compact />
          ) : (
            <div className="divide-y divide-border/50">
              {recentLogs.map((log) => {
                const score = log.waveScore ?? 0;
                return (
                  <div key={log.id} className="flex items-center gap-3 px-card py-item">
                    <span className="text-lg shrink-0">{waveEmoji(score)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{log.date}</span>
                        <span className={cn("text-[11px] font-bold", isDark ? "text-blue-400" : "text-blue-500")}>
                          {score}점
                        </span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {scoreTags(log).map((t) => (
                          <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Motivation banner */}
      <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] p-card flex items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-white font-semibold text-sm">오늘도 기록했다면, 내일도 할 수 있어요.</p>
          <p className="text-white/65 text-xs mt-0.5">연속 14일의 힘을 믿으세요.</p>
        </div>
        <button className="shrink-0 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
          흐름 보기 →
        </button>
      </div>
    </div>
  );
}
