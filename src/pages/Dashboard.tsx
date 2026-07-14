import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, Moon, Droplets } from "lucide-react";
import { useChartTheme } from "@/hooks/useChartTheme";
import EmptyState from "@/components/EmptyState";
import { StatCardSkeleton, ChartCardSkeleton } from "@/components/Skeleton";
import { usePageLoading } from "@/hooks/usePageLoading";
import WavelyLogo from "@/components/WavelyLogo";

const waveData = [
  { day: "월", value: 62 }, { day: "화", value: 55 }, { day: "수", value: 68 },
  { day: "목", value: 63 }, { day: "금", value: 71 }, { day: "토", value: 74 }, { day: "일", value: 73 },
];
const todayWave = [
  { t: "06시", v: 52 }, { t: "08시", v: 58 }, { t: "10시", v: 64 },
  { t: "12시", v: 61 }, { t: "14시", v: 59 }, { t: "16시", v: 66 },
  { t: "18시", v: 70 }, { t: "20시", v: 73 }, { t: "22시", v: 72 },
];
const streak = Array.from({ length: 21 }, (_, i) => ({ day: i + 1, done: i < 14 }));
const tabFilters = ["파도 점수", "운동", "집중력", "컨디션"];

const stats = [
  { label: "오늘의 파도", value: "73", unit: "점", sub: "어제보다 +6", icon: TrendingUp, iconColor: "text-blue-400",    lightBg: "from-blue-50 to-white",    darkBg: "from-blue-900/50 to-transparent" },
  { label: "운동 완료",   value: "25", unit: "분", sub: "목표 30분",   icon: Flame,      iconColor: "text-emerald-400", lightBg: "from-emerald-50 to-white", darkBg: "from-emerald-900/50 to-transparent" },
  { label: "수면 질",    value: "82", unit: "점", sub: "어젯밤 7h 20m", icon: Moon,      iconColor: "text-violet-400", lightBg: "from-violet-50 to-white",  darkBg: "from-violet-900/50 to-transparent" },
  { label: "수분 섭취",  value: "1.8", unit: "L", sub: "목표 2.0L",   icon: Droplets,   iconColor: "text-sky-400",    lightBg: "from-sky-50 to-white",     darkBg: "from-sky-900/50 to-transparent" },
];

export default function Dashboard() {
  const ct = useChartTheme();
  const isLoading = usePageLoading();

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
            { label: "오늘의 파도", value: "73", unit: "점" },
            { label: "연속 기록", value: "14", unit: "일 🔥" },
            { label: "운동", value: "25", unit: "분" },
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
              {tabFilters.map((t, i) => (
                <button key={t} className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors whitespace-nowrap ${
                  i === 0 ? "bg-[#1e3a8a] text-white border-transparent" : "text-muted-foreground border-border hover:border-muted-foreground"
                }`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
        {waveData.length === 0 ? (
          <div style={{ background: ct.bg }}>
            <EmptyState icon="〜" title="아직 파도가 없어요" description="첫 기록을 남기면 흐름이 시작돼요" action={{ label: "오늘 기록하기" }} />
          </div>
        ) : (
          <div style={{ background: ct.bg }} className="px-2 md:px-4 pb-4 pt-2">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={waveData}>
                <defs>
                  <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ct.blue} stopOpacity={ct.isDark ? 0.35 : 0.15} />
                    <stop offset="95%" stopColor={ct.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: ct.tick }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={ct.tooltip} />
                <Area type="monotone" dataKey="value" stroke={ct.blue} strokeWidth={2.5} fill="url(#waveGrad)" dot={{ r: 3.5, fill: ct.blue, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
            <div className={`mt-2 flex items-center gap-2 text-xs rounded-lg px-3 py-2.5 border-l-2 ${
              ct.isDark
                ? "text-foreground bg-card border-blue-500"
                : "text-slate-700 bg-blue-50 border-blue-400"
            }`}>
              <span className="shrink-0">✦</span>
              <span className="flex-1">이번 주 파도가 꾸준히 상승하고 있어요. 포기하지 않은 덕분이에요.</span>
              <Badge variant="secondary" className="text-[10px] shrink-0 hidden sm:flex">Gemini AI</Badge>
            </div>
          </div>
        )}
      </div>

      {/* ── 오늘의 파도 + 연속 기록 ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-item">
        {/* 오늘의 파도 */}
        <div className="rounded-xl bg-card border border-border/20 shadow-sm">
          <div className="flex items-center justify-between px-card pt-section pb-item">
            <h3 className="text-section font-bold text-foreground">오늘의 파도</h3>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              현재 진행 중
            </span>
          </div>
          <div style={{ background: ct.bg }} className="mx-3 rounded-lg px-1 pb-2">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={todayWave}>
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: ct.tick }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} hide />
                <Tooltip contentStyle={ct.tooltip} />
                <Line type="monotone" dataKey="v" stroke={ct.blue} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground px-card py-item">
            오후 6시 이후 꾸준히 올라가고 있어요. 오늘의 파도, 잘 마무리하고 있어요.
          </p>
        </div>

        {/* 연속 기록 */}
        <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] via-[#1d4ed8] to-[#2563eb] p-card shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-section font-bold text-white">연속 기록</h3>
            <span className="text-white/80 text-xs bg-white/10 px-2 py-0.5 rounded-full">🔥 14일 연속</span>
          </div>
          <div className="grid grid-cols-9 gap-1 md:gap-1.5">
            {streak.map((s) => (
              <div key={s.day} className={`aspect-square rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-semibold transition-all ${
                s.done ? "bg-white/90 text-[#1e3a8a] shadow-sm" : "bg-white/10 text-white/30"
              }`}>
                {s.day}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/65 mt-3 md:mt-4 leading-relaxed">
            오늘 포함 <strong className="text-white">14일</strong>을 이어왔어요.<br />
            지속 가능한 파도가 만들어지고 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
