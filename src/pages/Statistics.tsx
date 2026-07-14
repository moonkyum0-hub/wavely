import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { useChartTheme } from "@/hooks/useChartTheme";
import EmptyState from "@/components/EmptyState";

const barData = [
  { day: "월", v: 58 }, { day: "화", v: 62 }, { day: "수", v: 60 },
  { day: "목", v: 65 }, { day: "금", v: 68 }, { day: "토", v: 72 }, { day: "일", v: 75 },
];
const monthData = [
  { week: "1주", v: 58 }, { week: "2주", v: 63 }, { week: "3주", v: 61 }, { week: "4주", v: 70 },
];
const radarData = [
  { metric: "활동량", value: 78 }, { metric: "수면", value: 82 },
  { metric: "수분", value: 90 }, { metric: "컨디션", value: 75 },
  { metric: "식습관", value: 68 }, { metric: "스트레스", value: 62 },
];

const insights = [
  { icon: "↗", text: "수면 질이 3주 연속 개선되고 있어요.",          light: "bg-blue-50 border-blue-200",   accentHex: "#3b82f6" },
  { icon: "🔥", text: "이번 주 활동량이 지난주보다 16% 증가했어요.", light: "bg-amber-50 border-amber-200", accentHex: "#f59e0b" },
  { icon: "💧", text: "수분 섭취 목표 달성률이 70%예요. 조금만 더!", light: "bg-sky-50 border-sky-200",     accentHex: "#0ea5e9" },
  { icon: "🩷", text: "컨디션 평균이 이번 달 최고치를 기록했어요.",   light: "bg-rose-50 border-rose-200",   accentHex: "#f43f5e" },
];

const summaryCards = [
  { label: "평균 건강 점수", value: "71", unit: "점", sub: "지난 주 대비 +8",  icon: "📈",
    lightBg: "from-emerald-50 to-white", darkBg: "from-emerald-900/50 to-transparent",
    subLight: "text-emerald-600", subDark: "text-emerald-400" },
  { label: "목표 달성일",    value: "5",  unit: "/ 7일", sub: "2일 추가 달성", icon: "✅",
    lightBg: "from-blue-50 to-white",    darkBg: "from-blue-900/50 to-transparent",
    subLight: "text-blue-600",   subDark: "text-blue-400" },
  { label: "최고 점수",      value: "80", unit: "점",    sub: "일요일 기록",   icon: "🏆",
    lightBg: "from-amber-50 to-white",   darkBg: "from-amber-900/40 to-transparent",
    subLight: "text-amber-600",  subDark: "text-amber-400" },
];

export default function Statistics() {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const ct = useChartTheme();

  const GradBar = (props: any) => {
    const { x, y, width, height, index } = props;
    const opacity = 0.3 + (index / 6) * 0.7;
    const color = ct.isDark
      ? `rgba(96,165,250,${opacity})`
      : `rgba(30,58,138,${opacity})`;
    return <rect x={x} y={y} width={width} height={height} fill={color} rx={4} />;
  };

  const hdrStrip = ct.isDark
    ? "bg-black/15"
    : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent";

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
            <h3 className="text-section font-bold text-foreground">일별 건강 점수</h3>
            <p className="text-xs text-muted-foreground mt-0.5">높아질수록 짙어지는 파란빛</p>
          </div>
          <div style={{ background: ct.bg }} className="px-2 md:px-4 py-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barCategoryGap="35%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={ct.tooltip} />
                <Bar dataKey="v" shape={<GradBar />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
          <div className={`${ct.isDark ? "bg-black/15" : "bg-gradient-to-r from-violet-50/80 to-transparent"} px-card pt-section pb-item border-b border-border/40`}>
            <h3 className="text-section font-bold text-foreground">건강 균형도</h3>
            <p className="text-xs text-muted-foreground mt-0.5">6가지 지표의 균형을 확인해요</p>
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
          <p className="text-xs text-muted-foreground mt-0.5">4주간의 건강 점수 흐름</p>
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
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={ct.tooltip} />
              <Area type="monotone" dataKey="v" stroke={ct.emerald} strokeWidth={2.5} fill="url(#monthGrad)" dot={{ r: 4.5, fill: ct.emerald, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
        <div className={`${hdrStrip} px-card pt-section pb-item border-b border-border/50`}>
          <h3 className={`text-section font-bold ${ct.isDark ? "text-blue-300" : "text-blue-700"}`}>이번 주 인사이트</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Gemini AI가 분석한 나의 건강 패턴</p>
        </div>
        {insights.length === 0 ? (
          <EmptyState
            icon="✦"
            title="아직 분석할 데이터가 부족해요"
            description="3일 이상 기록하면 AI 인사이트가 생성돼요"
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
