import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const goals = [
  { icon: "📈", label: "하루 걸음 수", current: "7,842", target: "10,000걸음", pct: 78, color: "bg-blue-500", textColor: "text-blue-500" },
  { icon: "🌙", label: "수면 시간", current: "7.3시간", target: "8시간", pct: 91, color: "bg-violet-500", textColor: "text-violet-500" },
  { icon: "💧", label: "수분 섭취", current: "1.8L", target: "2L", pct: 90, color: "bg-emerald-500", textColor: "text-emerald-500" },
  { icon: "🔥", label: "운동 시간", current: "25분", target: "30분", pct: 83, color: "bg-amber-500", textColor: "text-amber-500" },
  { icon: "🩷", label: "컨디션 점수", current: "78점", target: "85점", pct: 92, color: "bg-rose-500", textColor: "text-rose-500" },
];
const habits = [
  "기상 후 물 한 잔",
  "점심 후 10분 산책",
  "취침 전 스트레칭",
  "저녁 8시 이후 음식 X",
  "하루 3번 심호흡",
];

export default function Goals() {
  const [checks, setChecks] = useState([true, true, false, false, true]);
  const done = checks.filter(Boolean).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">목표 설정</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">작은 목표가 큰 변화를 만들어요</p>
        </div>
        <Badge variant="outline" className="text-xs md:text-sm px-2.5 py-1.5 shrink-0">
          🏅 0 / 5 달성
        </Badge>
      </div>

      {/* Goal bars */}
      <div className="space-y-3">
        {goals.map((g) => (
          <Card key={g.label} className="shadow-sm">
            <CardContent className="py-4 px-4 md:px-5">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-lg md:text-xl shrink-0">{g.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{g.label}</span>
                    <span className="text-[11px] md:text-xs text-muted-foreground shrink-0">
                      {g.current} / {g.target}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", g.color)}
                      style={{ width: `${g.pct}%` }}
                    />
                  </div>
                </div>
                <span className={cn("text-sm font-bold shrink-0 w-9 text-right", g.textColor)}>
                  {g.pct}%
                </span>
                <button className="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Habit checklist */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2 px-4 md:px-5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">오늘의 습관 체크</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">작은 습관이 흐름을 만들어요</p>
            </div>
            <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-50 border-0 text-xs">
              {done}/5 완료
            </Badge>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(done / habits.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="px-4 md:px-5 space-y-2">
          {habits.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                const next = [...checks];
                next[i] = !next[i];
                setChecks(next);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border text-left transition-all",
                checks[i]
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-border hover:border-muted-foreground/30 bg-white"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                checks[i] ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/40"
              )}>
                {checks[i] && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className={cn(
                "text-xs md:text-sm",
                checks[i] ? "text-emerald-700 font-medium" : "text-foreground"
              )}>
                {h}
              </span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
