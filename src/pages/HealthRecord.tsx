"use client";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Zap, Star, ChevronRight, CheckCircle2, Pencil, Trash2, CalendarDays } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import EmptyState from "@/components/EmptyState";
import { LogItemSkeleton } from "@/components/Skeleton";
import { upsertRecord, getRecord, getRecords, getRecentRecords, deleteRecord } from "@/lib/healthService";
import { calcWaveScore, type HealthRecord as HealthRecordModel } from "@/lib/models";
import { getActiveGoals, getTargets } from "@/lib/goalService";

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

function scoreTags(r: HealthRecordModel) {
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
  const [justSaved,   setJustSaved]   = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [recentLogs,  setRecentLogs]  = useState<HealthRecordModel[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  /** 지금 폼이 편집 중인 날짜. 기본은 오늘이지만 지난 기록을 불러와 고칠 수 있다. */
  const [editingDate, setEditingDate] = useState(today);
  const [pendingDelete, setPendingDelete] = useState<HealthRecordModel | null>(null);
  const { show: showToast } = useToast();
  const isEditingToday = editingDate === today;

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

  // 편집 대상 날짜의 기록을 폼에 채운다. 날짜를 바꾸면 이전 값이 남지 않도록 항상 먼저 비운다.
  useEffect(() => {
    (async () => {
      setCondition(3);
      setSleep("");
      setExercise("");
      setWater("");
      setNote("");
      setSavedScore(null);
      setJustSaved(false);
      setIsReturning(false);
      try {
        const rec = await getRecord(editingDate);
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
    // loadRecent is async — every setState in it happens after an awaited DB read,
    // so the sync-setState-in-effect concern doesn't apply here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecent();
  }, [editingDate, loadRecent]);

  async function handleDelete() {
    if (!pendingDelete?.id) return;
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await deleteRecord(target.id!);
      // 지금 편집 중이던 기록을 지웠다면 폼을 오늘로 되돌린다
      if (target.date === editingDate) setEditingDate(today);
      await loadRecent();
      showToast(`${target.date} 기록을 지웠어요.`, "info");
    } catch {
      // dbExecute가 이미 토스트로 알려준다
    }
  }

  async function handleSave() {
    if (hasErrors) return;
    setIsSaving(true);
    try {
      const record: HealthRecordModel = {
        date:        editingDate,
        condition,
        sleepHours:  sleep    ? parseFloat(sleep)    : undefined,
        exerciseMin: exercise ? parseInt(exercise)   : undefined,
        waterMl:     water    ? Math.round(parseFloat(water) * 1000) : undefined,
        note:        note || undefined,
      };
      const targets = getTargets(await getActiveGoals());
      const score = calcWaveScore(record, targets);
      await upsertRecord(record);
      setSavedScore(score);
      setJustSaved(true);

      // 복귀 환영 UX — 어제 기록이 비어있는데 그 이전엔 기록이 있었다면 "공백 후 복귀"로 판단해
      // 저장 배너를 축하/환영 톤으로 바꾼다. 리셋이나 처벌 연출 없이, 돌아온 것 자체를 반긴다.
      // 지난 기록을 고치는 중이라면 "돌아왔다"는 서사가 맞지 않으므로 오늘 저장할 때만 판단한다.
      if (isEditingToday) {
        try {
          const yesterday = toDateStr(new Date(Date.now() - 86400000));
          const windowStart = toDateStr(new Date(Date.now() - 30 * 86400000));
          const priorWindow = await getRecords(windowStart, yesterday);
          const hadYesterday = priorWindow.some((r) => r.date === yesterday);
          setIsReturning(!hadYesterday && priorWindow.length > 0);
        } catch {
          setIsReturning(false);
        }
      }

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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-section font-bold text-foreground">
                {isEditingToday ? "오늘 건강 체크" : "지난 기록 고치기"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {editingDate} · {tab === "quick" ? "컨디션 + 3가지 핵심 지표" : "상세 기록 모드"}
              </p>
            </div>
            {!isEditingToday && (
              <button
                onClick={() => setEditingDate(today)}
                className={cn(
                  "shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors",
                  isDark
                    ? "border-border text-blue-300 hover:border-blue-500/50"
                    : "border-border text-blue-600 hover:border-blue-400"
                )}
              >
                <CalendarDays className="w-3.5 h-3.5" /> 오늘로
              </button>
            )}
          </div>
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
          {justSaved && (
            <div className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
              isReturning
                ? isDark ? "bg-blue-900/40 border border-blue-700/40 text-blue-300"
                         : "bg-blue-50 border border-blue-200 text-blue-700"
                : isDark ? "bg-teal-900/40 border border-teal-700/40 text-teal-300"
                         : "bg-emerald-50 border border-emerald-200 text-emerald-700"
            )}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {isReturning ? (
                savedScore != null ? (
                  <span>다시 만나서 반가워요. 파도는 언제든 다시 밀려와요 🌊 오늘의 파도 점수 <strong>{savedScore}점</strong></span>
                ) : (
                  <span>다시 만나서 반가워요. 파도는 언제든 다시 밀려와요 🌊 오늘 컨디션이 기록됐어요</span>
                )
              ) : savedScore != null ? (
                <span>저장 완료! 오늘의 파도 점수 <strong>{savedScore}점</strong></span>
              ) : (
                <span>저장 완료! 오늘 컨디션이 기록됐어요</span>
              )}
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
                const score = log.waveScore;
                const isBeingEdited = log.date === editingDate;
                return (
                  <div
                    key={log.id}
                    className={cn(
                      "flex items-center gap-3 px-card py-item",
                      isBeingEdited && (isDark ? "bg-blue-900/15" : "bg-blue-50/60")
                    )}
                  >
                    <span className="text-lg shrink-0">{score != null ? waveEmoji(score) : "–"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{log.date}</span>
                        <span className={cn("text-[11px] font-bold", isDark ? "text-blue-400" : "text-blue-500")}>
                          {score != null ? `${score}점` : "–"}
                        </span>
                        {isBeingEdited && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full",
                            isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                          )}>
                            고치는 중
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {scoreTags(log).map((t) => (
                          <span key={t} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingDate(log.date)}
                        aria-label={`${log.date} 기록 수정`}
                        title="수정"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(log)}
                        aria-label={`${log.date} 기록 삭제`}
                        title="삭제"
                        className={cn(
                          "p-1.5 rounded-lg transition-colors hover:bg-muted",
                          isDark ? "text-muted-foreground hover:text-rose-400" : "text-muted-foreground hover:text-rose-600"
                        )}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

      {/* 삭제 확인 — 되돌릴 수 없는 동작이라 한 번 더 묻는다 */}
      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPendingDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-card border border-border/30 shadow-lg p-card"
          >
            <h3 id="delete-title" className="text-section font-bold text-foreground">
              {pendingDelete.date} 기록을 지울까요?
            </h3>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              이 날의 컨디션·수면·운동·수분 기록이 모두 사라져요. 되돌릴 수 없어요.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setPendingDelete(null)}
                className="flex-1 h-10 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                그대로 둘게요
              </button>
              <button
                onClick={handleDelete}
                className={cn(
                  "flex-1 h-10 rounded-lg text-sm font-semibold text-white transition-colors",
                  isDark ? "bg-rose-600 hover:bg-rose-500" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
