import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  { icon: "↗", text: "수면 질이 3주 연속 개선되고 있어요." },
  { icon: "🔥", text: "이번 주 활동량이 지난주보다 16% 증가했어요." },
  { icon: "💧", text: "수분 섭취 목표 달성률이 70%예요. 조금만 더!" },
  { icon: "🩷", text: "컨디션 평균이 이번 달 최고치를 기록했어요." },
];

const GradBar = (props: any) => {
  const { x, y, width, height, index } = props;
  const opacity = 0.3 + (index / 6) * 0.7;
  return <rect x={x} y={y} width={width} height={height} fill={`rgba(30,58,138,${opacity})`} rx={4} />;
};

export default function Statistics() {
  const [period, setPeriod] = useState<"week" | "month">("week");

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">건강 통계</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">흐름을 숫자로 확인해보세요</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {(["week", "month"] as const).map((p) => (
            <Button
              key={p} size="sm" variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-[var(--wave-navy)] text-white text-xs" : "text-xs"}
            >
              {p === "week" ? "이번 주" : "이번 달"}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary — 1-col mobile, 3-col desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { label: "평균 건강 점수", value: "71", unit: "점", sub: "+8", subColor: "text-emerald-500" },
          { label: "목표 달성일", value: "5", unit: "/ 7일", sub: "+2", subColor: "text-emerald-500" },
          { label: "최고 점수", value: "80", unit: "점", sub: "일요일", subColor: "text-amber-500" },
        ].map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="pt-4 pb-4 px-4 md:px-5">
              <p className="text-xs md:text-sm text-muted-foreground">{c.label}</p>
              <div className="text-2xl md:text-3xl font-bold text-foreground mt-1.5">
                {c.value}
                <span className="text-xs md:text-sm font-normal text-muted-foreground ml-1">{c.unit}</span>
              </div>
              <p className={`text-xs font-semibold mt-1 ${c.subColor}`}>{c.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts — 1-col mobile, 2-col desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-1 px-4 md:px-5">
            <CardTitle className="text-sm">일별 건강 점수</CardTitle>
            <p className="text-xs text-muted-foreground">높아질수록 짙어지는 파란빛</p>
          </CardHeader>
          <CardContent className="px-2 md:px-5">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={barData} barCategoryGap="35%">
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={26} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
                <Bar dataKey="v" shape={<GradBar />} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-1 px-4 md:px-5">
            <CardTitle className="text-sm">건강 균형도</CardTitle>
            <p className="text-xs text-muted-foreground">6가지 지표의 균형을 확인해요</p>
          </CardHeader>
          <CardContent className="px-2 md:px-5">
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.18} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="pb-1 px-4 md:px-5">
          <CardTitle className="text-sm">월간 성장 추세</CardTitle>
          <p className="text-xs text-muted-foreground">4주간의 건강 점수 흐름</p>
        </CardHeader>
        <CardContent className="px-2 md:px-5">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={monthData}>
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={26} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "none", fontSize: 12 }} />
              <Line type="monotone" dataKey="v" stroke="#1e3a8a" strokeWidth={2.5} dot={{ r: 4.5, fill: "#1e3a8a", strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-1 px-4 md:px-5">
          <CardTitle className="text-sm text-blue-600">이번 주 인사이트</CardTitle>
        </CardHeader>
        <CardContent className="px-4 md:px-5">
          <div className="space-y-0">
            {insights.map((ins, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3 border-b border-border last:border-0"
              >
                <span className="text-base w-5 shrink-0 text-center">{ins.icon}</span>
                <span className="text-xs md:text-sm text-foreground">{ins.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
