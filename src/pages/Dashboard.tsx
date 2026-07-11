import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Flame, Moon, Droplets } from "lucide-react";

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
const tabFilters = ["파동 점수", "운동", "집중력", "컨디션"];

const stats = [
  {
    label: "오늘의 파동", value: "73", unit: "점",
    sub: "어제보다 +6", subColor: "text-blue-500",
    icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-500",
  },
  {
    label: "운동 완료", value: "25", unit: "분",
    sub: "목표 30분", subColor: "text-emerald-500",
    icon: Flame, iconBg: "bg-emerald-50", iconColor: "text-emerald-500",
  },
  {
    label: "수면 질", value: "82", unit: "점",
    sub: "어젯밤 7h 20m", subColor: "text-violet-500",
    icon: Moon, iconBg: "bg-violet-50", iconColor: "text-violet-500",
  },
  {
    label: "수분 섭취", value: "1.8", unit: "L",
    sub: "목표 2.0L", subColor: "text-sky-500",
    icon: Droplets, iconBg: "bg-sky-50", iconColor: "text-sky-500",
  },
];

export default function Dashboard() {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            안녕하세요, 지현님 👋
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            2026년 7월 11일 토요일 · 완벽한 하루 대신, 오늘의 파동을 만들어가요
          </p>
        </div>
        <Button
          size="sm"
          className="shrink-0 bg-[var(--wave-navy)] hover:bg-[var(--wave-navy)]/90 text-white"
        >
          + 오늘 기록
        </Button>
      </div>

      {/* Stat cards — 2-col on mobile, 4-col on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map(({ label, value, unit, sub, subColor, icon: Icon, iconBg, iconColor }) => (
          <Card key={label} className="shadow-sm border-border">
            <CardContent className="pt-4 pb-4 px-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs md:text-sm text-muted-foreground font-medium">{label}</span>
                <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-foreground leading-none">
                {value}
                <span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">{unit}</span>
              </div>
              <p className={`text-[11px] md:text-xs mt-2 font-medium ${subColor}`}>{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 7일 파동 흐름 */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <CardTitle className="text-sm md:text-base">7일 파동 흐름</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">작은 변화들이 쌓여 파동이 됩니다</p>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {tabFilters.map((t, i) => (
                <button
                  key={t}
                  className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors whitespace-nowrap ${
                    i === 0
                      ? "bg-[var(--wave-navy)] text-white border-transparent"
                      : "text-muted-foreground border-border hover:border-slate-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-2 md:px-6">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={waveData}>
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: 12 }} />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} fill="url(#waveGrad)" dot={{ r: 3.5, fill: "#3b82f6", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-3 flex items-center gap-2 text-xs md:text-sm text-blue-700 bg-blue-50 rounded-lg px-3 md:px-4 py-2.5 border-l-2 border-blue-400">
            <span className="text-sm shrink-0">✦</span>
            <span className="flex-1 min-w-0">이번 주 파동이 꾸준히 상승하고 있어요. 포기하지 않은 덕분이에요.</span>
            <Badge variant="secondary" className="ml-auto text-[10px] shrink-0 hidden sm:flex">Gemini AI</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 오늘의 파동 + 연속 기록 — 1-col on mobile, 2-col on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-1 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">오늘의 파동</CardTitle>
              <span className="text-xs text-emerald-500 font-medium">↗ 현재 진행 중</span>
            </div>
          </CardHeader>
          <CardContent className="px-2 md:px-6">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={todayWave}>
                <XAxis dataKey="t" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} hide />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 11 }} />
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground mt-2 px-2 md:px-0">
              오후 6시 이후 꾸준히 올라가고 있어요. 오늘의 파동, 잘 마무리하고 있어요.
            </p>
          </CardContent>
        </Card>

        <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] p-4 md:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">연속 기록</span>
            <span className="text-white/80 text-xs">🔥 14일 연속</span>
          </div>
          <div className="grid grid-cols-9 gap-1 md:gap-1.5">
            {streak.map((s) => (
              <div
                key={s.day}
                className={`aspect-square rounded-full flex items-center justify-center text-[9px] md:text-[10px] font-semibold ${
                  s.done ? "bg-white/90 text-[#1e3a8a]" : "bg-white/10 text-white/30"
                }`}
              >
                {s.day}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/70 mt-3 md:mt-4 leading-relaxed">
            오늘 포함 <strong className="text-white">14일</strong>을 이어왔어요.<br />
            지속 가능한 파동이 만들어지고 있어요.
          </p>
        </div>
      </div>
    </div>
  );
}
