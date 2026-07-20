import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, Moon, Droplets } from "lucide-react";
import { useChartTheme } from "@/hooks/useChartTheme";
import EmptyState from "@/components/EmptyState";
import { StatCardSkeleton, ChartCardSkeleton } from "@/components/Skeleton";
import WavelyLogo from "@/components/WavelyLogo";
import { getRecentRecords } from "@/lib/healthService";
import type { HealthRecord } from "@/lib/models";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function deltaText(
  current: number | null | undefined,
  prev: number | null | undefined,
  unit: string,
  decimals: number,
  fallback: string
): string {
  if (current == null || prev == null) return fallback;
  const factor = 10 ** decimals;
  const diff = Math.round((current - prev) * factor) / factor;
  if (diff === 0) return "어제와 같아요";
  return `어제보다 ${diff > 0 ? "+" : ""}${diff}${unit}`;
}

function subScores(r: HealthRecord) {
  return {
    sleep:     Math.round(Math.min((r.sleepHours ?? 0) / 8, 1) * 100),
    exercise:  Math.round(Math.min((r.exerciseMin ?? 0) / 30, 1) * 100),
    water:     Math.round(Math.min((r.waterMl ?? 0) / 2000, 1) * 100),
    condition: Math.round(((r.condition ?? 0) / 5) * 100),
  };
}

type TabKey = "wave" | "exercise" | "focus" | "condition";
const TAB_CONFIG: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: "wave",      label: "파도 점수" },
  { key: "exercise",  label: "운동" },
  { key: "focus",     label: "집중력", disabled: true },
  { key: "condition", label: "컨디션" },
];

export default function Dashboard() {
  const ct = useChartTheme();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("wave");

  useEffect(() => {
    (async () => {
      try {
        const recs = await getRecentRecords(21);
        setRecords(recs);
      } catch {
        // dev browser mode — no Tauri runtime
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const byDate = useMemo(() => {
    const map = new Map<string, HealthRecord>();
    records.forEach((r) => map.set(r.date, r));
    return map;
  }, [records]);

  const { today, yesterday } = useMemo(() => {
    const now = new Date();
    return { today: toDateStr(now), yesterday: toDateStr(new Date(now.getTime() - 86400000)) };
  }, []);
  const todayRecord = byDate.get(today) ?? null;
  const yesterdayRecord = byDate.get(yesterday) ?? null;

  const todayWaterL = todayRecord?.waterMl != null ? todayRecord.waterMl / 1000 : undefined;
  const yesterdayWaterL = yesterdayRecord?.waterMl != null ? yesterdayRecord.waterMl / 1000 : undefined;

  const waveSub = deltaText(todayRecord?.waveScore, yesterdayRecord?.waveScore, "", 0, "아직 기록 전");
  const exerciseSub = deltaText(todayRecord?.exerciseMin, yesterdayRecord?.exerciseMin, "분", 0, "목표 30분");
  const sleepSub = deltaText(todayRecord?.sleepHours, yesterdayRecord?.sleepHours, "h", 1, "목표 8h");
  const waterSub = deltaText(todayWaterL, yesterdayWaterL, "L", 1, "목표 2.0L");

  const stats = [
    {
      label: "오늘의 파도", value: todayRecord?.waveScore != null ? String(todayRecord.waveScore) : "–", unit: todayRecord ? "점" : "",
      sub: waveSub,
      icon: TrendingUp, iconColor: "text-blue-400", lightBg: "from-blue-50 to-white", darkBg: "from-blue-900/50 to-transparent",
    },
    {
      label: "운동 완료", value: String(todayRecord?.exerciseMin ?? 0), unit: "분",
      sub: exerciseSub, icon: Flame, iconColor: "text-emerald-400", lightBg: "from-emerald-50 to-white", darkBg: "from-emerald-900/50 to-transparent",
    },
    {
      label: "수면 시간", value: todayRecord?.sleepHours != null ? String(todayRecord.sleepHours) : "–", unit: "h",
      sub: sleepSub, icon: Moon, iconColor: "text-violet-400", lightBg: "from-violet-50 to-white", darkBg: "from-violet-900/50 to-transparent",
    },
    {
      label: "수분 섭취", value: todayRecord?.waterMl != null ? (todayRecord.waterMl / 1000).toFixed(1) : "0", unit: "L",
      sub: waterSub, icon: Droplets, iconColor: "text-sky-400", lightBg: "from-sky-50 to-white", darkBg: "from-sky-900/50 to-transparent",
    },
  ];

  const last7Dates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return toDateStr(d);
    }),
    []
  );

  const chartData = useMemo(
    () => last7Dates.map((date) => {
      const r = byDate.get(date);
      const d = new Date(date + "T00:00:00");
      return {
        day: WEEKDAY_KR[d.getDay()],
        wave: r?.waveScore ?? null,
        exercise: r?.exerciseMin ?? null,
        condition: r?.condition != null ? r.condition * 20 : null,
      };
    }),
    [last7Dates, byDate]
  );

  const hasWeekData = chartData.some((d) => d.wave != null);

  const validWaves = chartData.map((d) => d.wave).filter((v): v is number => v != null);
  const trendText =
    validWaves.length >= 2
      ? validWaves[validWaves.length - 1] >= validWaves[0]
        ? "이번 주 파도가 꾸준히 상승하고 있어요. 포기하지 않은 덕분이에요."
        : "이번 주는 파도가 조금 낮아졌어요. 괜찮아요, 흐름은 계속 이어지고 있어요."
      : "기록이 쌓이면 이번 주 흐름을 여기서 보여드릴게요.";

  const streakDays = useMemo(() => {
    const arr: { day: number; date: string; done: boolean }[] = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      arr.push({ day: d.getDate(), date: ds, done: byDate.has(ds) });
    }
    return arr;
  }, [byDate]);

  const streakCount = useMemo(() => {
    let count = 0;
    const d = new Date();
    if (!byDate.has(toDateStr(d))) d.setDate(d.getDate() - 1);
    while (byDate.has(toDateStr(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [byDate]);

  const todaySub = todayRecord ? subScores(todayRecord) : null;
  const subRows = todaySub
    ? [
        { label: "수면", value: todaySub.sleep, color: ct.isDark ? "#a78bfa" : "#7c3aed" },
        { label: "운동", value: todaySub.exercise, color: ct.isDark ? "#34d399" : "#059669" },
        { label: "수분", value: todaySub.water, color: ct.blue },
        { label: "컨디션", value: todaySub.condition, color: ct.isDark ? "#fbbf24" : "#d97706" },
      ]
    : [];

  const dataKey = activeTab === "focus" ? "wave" : activeTab;
  const domain: [number, "auto" | number] = activeTab === "exercise" ? [0, "auto"] : [0, 100];

  if (isLoading) {
    return (
      <div className="space-y-section">
        <div className="hidden md:flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
            <div className="h-3.5 w-64 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-item">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <ChartCardSkeleton height={150} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-item">
          <ChartCardSkeleton height={100} />
          <ChartCardSkeleton height={100} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-section">
      {/* ── Mobile header ── */}
      <div className="md:hidden -mx-4 -mt-4 px-5 pt-8 pb-6 bg-gradient-to-br from-[#1e3a8a] to-[#2563eb]">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <WavelyLogo size={28} />
              <p className="text-white/70 text-xs font-medium">Wavely · 건강의 흐름</p>
            </div>
            <h1 className="text-page font-bold text-white">안녕하세요, 지현님 👋</h1>
            <p className="text-white/55 text-xs mt-1">완벽한 하루 대신, 오늘의 파도를 만들어가요</p>
          </div>
          <Button size="sm" className="shrink-0 bg-white/20 hover:bg-white/30 text-white border-0 text-xs">
            + 기록
          </Button>
        </div>
        <div className="flex gap-2.5">
          {[
            { label: "오늘의 파도", value: todayRecord?.waveScore != null ? String(todayRecord.waveScore) : "–", unit: "점" },
            { label: "연속 기록", value: String(streakCount), unit: "일 🔥" },
            { label: "운동", value: String(todayRecord?.exerciseMin ?? 0), unit: "분" },
          ].map((m) => (
            <div key={m.label} className="flex-1 bg-white/12 rounded-xl px-3 py-2.5 text-center backdrop-blur-sm">
              <div className="text-white/55 text-[10px] mb-0.5">{m.label}</div>
              <div className="text-white font-bold text-[17px] leading-none">
                {m.value}<span className="text-[11px] font-normal ml-0.5">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden md:flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-bold text-foreground">안녕하세요, 지현님 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">
            완벽한 하루 대신, 오늘의 파도를 만들어가요
          </p>
        </div>
        <Button size="sm" className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white shrink-0">
          + 오늘 기록
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-item">
        {stats.map(({ label, value, unit, sub, icon: Icon, iconColor, lightBg }) => (
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
          </div>
        ))}
      </div>

      {/* ── 7일 파도 흐름 ── */}
      <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
        <div className={`px-card pt-section pb-item border-b border-border/40 ${
          ct.isDark
            ? "bg-black/15"
            : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-section font-bold text-foreground">7일 파도 흐름</h2>
              <p className="text-xs text-muted-foreground mt-0.5">작은 변화들이 쌓여 파도가 됩니다</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {TAB_CONFIG.map((t) => (
                <button
                  key={t.key}
                  disabled={t.disabled}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors whitespace-nowrap ${
                    t.disabled
                      ? "text-muted-foreground/40 border-border/50 cursor-not-allowed"
                      : activeTab === t.key
                        ? "bg-[#1e3a8a] text-white border-transparent"
                        : "text-muted-foreground border-border hover:border-muted-foreground"
                  }`}
                >{t.label}{t.disabled ? " · 준비중" : ""}</button>
              ))}
            </div>
          </div>
        </div>
        {!hasWeekData ? (
          <div style={{ background: ct.bg }}>
            <EmptyState icon="〜" title="아직 파도가 없어요" description="첫 기록을 남기면 흐름이 시작돼요" action={{ label: "오늘 기록하기" }} />
          </div>
        ) : (
          <div style={{ background: ct.bg }} className="px-2 md:px-4 pb-4 pt-2">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ct.blue} stopOpacity={ct.isDark ? 0.35 : 0.15} />
                    <stop offset="95%" stopColor={ct.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={domain} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={ct.tooltip} />
                <Area type="monotone" dataKey={dataKey} stroke={ct.blue} strokeWidth={2.5} fill="url(#waveGrad)" dot={{ r: 3.5, fill: ct.blue, strokeWidth: 0 }} connectNulls />
              </AreaChart>
            </ResponsiveContainer>
            <div className={`mt-2 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 border-l-2 ${
              ct.isDark
                ? "text-foreground bg-card border-blue-500"
                : "text-slate-700 bg-blue-50 border-blue-400"
            }`}>
              <span className="shrink-0">✦</span>
              <span className="flex-1">{trendText}</span>
              <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:flex">Gemini AI</Badge>
            </div>
          </div>
        )}
      </div>

      {/* ── 오늘의 파도 + 연속 기록 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-item">
        {/* 오늘의 파도 구성 */}
        <div className="rounded-xl bg-card border border-border/20 shadow-sm">
          <div className="flex items-center justify-between px-card pt-section pb-item">
            <h3 className="text-section font-bold text-foreground">오늘의 파도 구성</h3>
            {todayRecord ? (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                기록 완료
              </span>
            ) : (
              <span className="text-xs text-muted-foreground font-medium">기록 전</span>
            )}
          </div>
          {!todayRecord ? (
            <EmptyState icon="✏️" title="오늘 기록이 아직 없어요" description="빠른 기록으로 30초면 끝나요" compact />
          ) : (
            <div className="px-card pb-card space-y-3">
              {subRows.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12 shrink-0">{s.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${s.value}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-9 text-right shrink-0">{s.value}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 연속 기록 */}
        <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] p-card shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-section font-bold text-white">연속 기록</h3>
            <span className="text-white/80 text-xs bg-white/10 px-2 py-0.5 rounded-full">🔥 {streakCount}일 연속</span>
          </div>
          <div className="grid grid-cols-9 gap-1 md:gap-1.5">
            {streakDays.map((s) => (
              <div key={s.date} className={`aspect-square rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-semibold transition-all ${
                s.done ? "bg-white/90 text-[#1e3a8a] shadow-sm" : "bg-white/10 text-white/30"
              }`}>
                {s.day}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/65 mt-3 md:mt-4 leading-relaxed">
            {streakCount > 0 ? (
              <>오늘 포함 <strong className="text-white">{streakCount}일</strong>을 이어왔어요.<br />지속 가능한 파도가 만들어지고 있어요.</>
            ) : (
              <>오늘 기록을 남기면 새로운 흐름이 시작돼요.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
