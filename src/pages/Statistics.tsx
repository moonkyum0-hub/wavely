import { useState, useEffect, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import EmptyState from "@/components/EmptyState";
import { StatCardSkeleton, ChartCardSkeleton } from "@/components/Skeleton";
import { getRecentRecords } from "@/lib/healthService";
import { getActiveGoals } from "@/lib/goalService";
import type { HealthRecord } from "@/lib/models";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
const WEEKDAY_KR = ["일", "월", "화", "수", "목", "금", "토"];

function lastNDates(n: number, offsetDays = 0) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays - (n - 1 - i));
    return toDateStr(d);
  });
}

interface GradBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  isDark?: boolean;
}

// Recharts가 x/y/width/height/index를 주입하고, isDark만 우리가 넘긴다.
function GradBar({ x, y, width, height, index = 0, isDark }: GradBarProps) {
  const opacity = 0.3 + (index / 6) * 0.7;
  const color = isDark ? `rgba(96,165,250,${opacity})` : `rgba(30,58,138,${opacity})`;
  return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
}

export default function Statistics() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const ct = useChartTheme();

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [waveGoalTarget, setWaveGoalTarget] = useState(80);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [recs, goals] = await Promise.all([getRecentRecords(60), getActiveGoals()]);
        setRecords(recs);
        const waveGoal = goals.find((g) => g.type === "wave");
        if (waveGoal) setWaveGoalTarget(waveGoal.targetValue);
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

  const days = period === "week" ? 7 : 28;
  const currentDates = useMemo(() => lastNDates(days, 0), [days]);
  const prevDates = useMemo(() => lastNDates(days, days), [days]);
  const currentRecs = currentDates.map((d) => byDate.get(d)).filter((r): r is HealthRecord => !!r);
  const prevRecs = prevDates.map((d) => byDate.get(d)).filter((r): r is HealthRecord => !!r);

  function avgOf(recs: HealthRecord[], fn: (r: HealthRecord) => number) {
    if (!recs.length) return null;
    return Math.round(recs.reduce((sum, r) => sum + fn(r), 0) / recs.length);
  }

  const currentAvgWave = avgOf(currentRecs, (r) => r.waveScore ?? 0);
  const prevAvgWave = avgOf(prevRecs, (r) => r.waveScore ?? 0);
  const waveDelta = currentAvgWave != null && prevAvgWave != null ? currentAvgWave - prevAvgWave : null;

  const achievedDays = currentRecs.filter((r) => (r.waveScore ?? 0) >= waveGoalTarget).length;

  const bestRecord = currentRecs.reduce<HealthRecord | null>(
    (best, r) => (r.waveScore != null && (best == null || r.waveScore > (best.waveScore ?? -1)) ? r : best),
    null
  );

  const summaryCards = [
    {
      label: "평균 파도 점수", value: currentAvgWave != null ? String(currentAvgWave) : "–", unit: "점",
      sub: waveDelta != null ? `지난 기간 대비 ${waveDelta >= 0 ? "+" : ""}${waveDelta}` : "데이터가 쌓이는 중",
      icon: "📈", lightBg: "from-emerald-50 to-white", darkBg: "from-emerald-900/50 to-transparent",
      subLight: "text-emerald-600", subDark: "text-emerald-400",
    },
    {
      label: "목표 달성일", value: String(achievedDays), unit: `/ ${days}일`,
      sub: `목표 ${waveGoalTarget}점 이상`,
      icon: "✅", lightBg: "from-blue-50 to-white", darkBg: "from-blue-900/50 to-transparent",
      subLight: "text-blue-600", subDark: "text-blue-400",
    },
    {
      label: "최고 점수", value: bestRecord?.waveScore != null ? String(bestRecord.waveScore) : "–", unit: "점",
      sub: bestRecord ? `${bestRecord.date} 기록` : "기록을 쌓아보세요",
      icon: "🏆", lightBg: "from-amber-50 to-white", darkBg: "from-amber-900/40 to-transparent",
      subLight: "text-amber-600", subDark: "text-amber-400",
    },
  ];

  const weekDates = useMemo(() => lastNDates(7), []);
  const barData = weekDates.map((date) => {
    const r = byDate.get(date);
    const d = new Date(date + "T00:00:00");
    return { day: WEEKDAY_KR[d.getDay()], v: r?.waveScore ?? null };
  });

  const monthDates = useMemo(() => lastNDates(28), []);
  const monthData = useMemo(() => {
    const buckets = [
      { label: "1주", values: [] as number[] }, { label: "2주", values: [] as number[] },
      { label: "3주", values: [] as number[] }, { label: "4주", values: [] as number[] },
    ];
    monthDates.forEach((date, i) => {
      const r = byDate.get(date);
      if (r?.waveScore != null) buckets[Math.floor(i / 7)].values.push(r.waveScore);
    });
    return buckets.map((b) => ({
      week: b.label,
      v: b.values.length ? Math.round(b.values.reduce((a, c) => a + c, 0) / b.values.length) : null,
    }));
  }, [monthDates, byDate]);

  const radarData = [
    { metric: "활동량", value: avgOf(currentRecs, (r) => Math.min((r.exerciseMin ?? 0) / 30, 1) * 100) ?? 0 },
    { metric: "수면",   value: avgOf(currentRecs, (r) => Math.min((r.sleepHours ?? 0) / 8, 1) * 100) ?? 0 },
    { metric: "수분",   value: avgOf(currentRecs, (r) => Math.min((r.waterMl ?? 0) / 2000, 1) * 100) ?? 0 },
    { metric: "컨디션", value: avgOf(currentRecs, (r) => ((r.condition ?? 0) / 5) * 100) ?? 0 },
  ];

  const insights: { icon: string; text: string; light: string; accentHex: string }[] = [];
  if (waveDelta != null) {
    if (waveDelta > 0) insights.push({ icon: "↗", text: `평균 파도 점수가 지난 기간보다 ${waveDelta}점 올랐어요.`, light: "bg-blue-50 border-blue-200", accentHex: "#3b82f6" });
    else if (waveDelta < 0) insights.push({ icon: "〜", text: `평균 파도 점수가 지난 기간보다 ${Math.abs(waveDelta)}점 내려갔어요. 흐름은 계속 이어지고 있어요.`, light: "bg-blue-50 border-blue-200", accentHex: "#3b82f6" });
    else insights.push({ icon: "→", text: "지난 기간과 비슷한 흐름을 유지하고 있어요.", light: "bg-blue-50 border-blue-200", accentHex: "#3b82f6" });
  }
  const exercisePct = radarData.find((r) => r.metric === "활동량")?.value;
  if (currentRecs.length && exercisePct != null) {
    insights.push({ icon: "🔥", text: `이번 기간 평균 운동 목표 달성률은 ${exercisePct}%예요.`, light: "bg-amber-50 border-amber-200", accentHex: "#f59e0b" });
  }
  const waterPct = radarData.find((r) => r.metric === "수분")?.value;
  if (currentRecs.length && waterPct != null) {
    insights.push({ icon: "💧", text: `수분 섭취 목표 달성률이 평균 ${waterPct}%예요.`, light: "bg-sky-50 border-sky-200", accentHex: "#0ea5e9" });
  }
  if (currentRecs.length >= days * 0.5) {
    insights.push({ icon: "🩷", text: `${days}일 중 ${currentRecs.length}일을 기록했어요. 꾸준함이 쌓이고 있어요.`, light: "bg-rose-50 border-rose-200", accentHex: "#f43f5e" });
  }

  const hdrStrip = ct.isDark
    ? "bg-black/15"
    : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent";

  if (isLoading) {
    return (
      <div className="space-y-section">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
          <div className="h-3.5 w-52 animate-pulse rounded-md bg-slate-200/80 dark:bg-[#1a3050]/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-item">
          {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
          <ChartCardSkeleton height={160} />
          <ChartCardSkeleton height={190} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-section">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-page font-bold text-foreground">건강 통계</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">흐름을 숫자로 확인해보세요</p>
        </div>
        <div className="flex gap-1.5 shrink-0 bg-muted rounded-lg p-1">
          {(["week", "month"] as const).map((p) => (
            <button
              key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                period === p
                  ? ct.isDark ? "bg-card shadow-sm text-foreground" : "bg-card shadow-sm text-[#1e3a8a]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "week" ? "이번 주" : "이번 달"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-item">
        {summaryCards.map((c) => (
          <div key={c.label} className={`rounded-xl border border-border/20 shadow-sm p-card ${ct.isDark ? "bg-card" : `bg-gradient-to-br ${c.lightBg}`}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
              <span className="text-base">{c.icon}</span>
            </div>
            <div className="text-display font-bold text-foreground">
              {c.value}<span className="text-xs font-normal text-muted-foreground ml-1">{c.unit}</span>
            </div>
            <p className={`text-[11px] mt-2 font-medium ${ct.isDark ? c.subDark : c.subLight}`}>{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
        <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
          <div className={`${hdrStrip} px-card pt-section pb-item border-b border-border/40`}>
            <h3 className="text-section font-bold text-foreground">일별 파도 점수</h3>
            <p className="text-xs text-muted-foreground mt-0.5">최근 7일 · 높아질수록 짙어지는 파란빛</p>
          </div>
          <div style={{ background: ct.bg }} className="px-2 md:px-4 py-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barCategoryGap="35%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={ct.tooltip} />
                <Bar dataKey="v" shape={<GradBar isDark={ct.isDark} />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
          <div className={`${ct.isDark ? "bg-black/15" : "bg-gradient-to-r from-violet-50/80 to-transparent"} px-card pt-section pb-item border-b border-border/40`}>
            <h3 className="text-section font-bold text-foreground">건강 균형도</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{period === "week" ? "이번 주" : "이번 달"} 4가지 지표의 균형을 확인해요</p>
          </div>
          <div style={{ background: ct.bg }} className="px-2 md:px-4 py-3">
            <ResponsiveContainer width="100%" height={190}>
              <RadarChart data={radarData}>
                <PolarGrid stroke={ct.polarGrid} />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: ct.polarAxis }} />
                <Radar dataKey="value" stroke={ct.violet} fill={ct.violet} fillOpacity={ct.isDark ? 0.25 : 0.12} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
        <div className={`${ct.isDark ? "bg-black/15" : "bg-gradient-to-r from-emerald-50/80 to-transparent"} px-card pt-section pb-item border-b border-border/40`}>
          <h3 className="text-section font-bold text-foreground">월간 성장 추세</h3>
          <p className="text-xs text-muted-foreground mt-0.5">4주간의 파도 점수 흐름</p>
        </div>
        <div style={{ background: ct.bg }} className="px-2 md:px-4 py-3">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={monthData}>
              <defs>
                <linearGradient id="monthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ct.emerald} stopOpacity={ct.isDark ? 0.35 : 0.15} />
                  <stop offset="95%" stopColor={ct.emerald} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={ct.tooltip} />
              <Area type="monotone" dataKey="v" stroke={ct.emerald} strokeWidth={2.5} fill="url(#monthGrad)" dot={{ r: 4.5, fill: ct.emerald, strokeWidth: 0 }} connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
        <div className={`${hdrStrip} px-card pt-section pb-item border-b border-border/50`}>
          <h3 className={`text-section font-bold ${ct.isDark ? "text-blue-300" : "text-blue-700"}`}>이번 {period === "week" ? "주" : "달"} 인사이트</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gemini AI가 분석한 나의 건강 패턴</p>
        </div>
        {insights.length === 0 ? (
          <EmptyState
            icon="✦"
            title="아직 분석할 데이터가 부족해요"
            description="3일 이상 기록하면 인사이트가 생성돼요"
            action={{ label: "기록하러 가기" }}
            compact
          />
        ) : (
          <div className="p-item grid grid-cols-1 sm:grid-cols-2 gap-tight">
            {insights.map((ins, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-item rounded-lg border ${ct.isDark ? "bg-card border-border/30" : ins.light}`}
                style={ct.isDark ? { borderLeftWidth: "3px", borderLeftColor: ins.accentHex } : undefined}
              >
                <span className="text-base shrink-0 mt-0.5">{ins.icon}</span>
                <span className={`text-xs leading-relaxed ${ct.isDark ? "text-foreground" : "text-slate-700"}`}>{ins.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
