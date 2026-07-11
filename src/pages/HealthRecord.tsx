import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Zap, Star } from "lucide-react";

const conditions = [
  { label: "힘들어요", emoji: "😞", value: "bad" },
  { label: "보통이에요", emoji: "😐", value: "ok" },
  { label: "좋아요", emoji: "😊", value: "good" },
];

const fields = [
  { label: "걸음 수", placeholder: "7,842" },
  { label: "수면 시간", placeholder: "7.5h" },
  { label: "수분 (L)", placeholder: "1.8" },
];

export default function HealthRecord() {
  const [condition, setCondition] = useState("ok");
  const [tab, setTab] = useState<"quick" | "detail">("quick");

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">오늘의 건강 기록</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">매일 기록하는 것 자체가 이미 성장이에요</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("quick")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all",
            tab === "quick"
              ? "bg-[var(--wave-teal)] text-white shadow-sm"
              : "border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Zap className="w-3.5 h-3.5" /> 빠른 기록
          <span className="text-[11px] opacity-70 ml-0.5 hidden sm:inline">3가지만 빠르게</span>
        </button>
        <button
          onClick={() => setTab("detail")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all",
            tab === "detail"
              ? "bg-[var(--wave-teal)] text-white shadow-sm"
              : "border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className="w-3.5 h-3.5" /> 상세 기록
        </button>
      </div>

      {/* Form */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-6 px-4 md:px-6 space-y-6">
          {/* Condition */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">오늘 컨디션은?</p>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {conditions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCondition(c.value)}
                  className={cn(
                    "py-4 md:py-5 rounded-xl border-2 text-center transition-all",
                    condition === c.value
                      ? "border-amber-400 bg-amber-50"
                      : "border-border hover:border-muted-foreground/30 bg-white"
                  )}
                >
                  <div className="text-2xl md:text-3xl mb-1">{c.emoji}</div>
                  <div className={cn(
                    "text-xs md:text-sm",
                    condition === c.value ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}>
                    {c.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-3 gap-3">
            {fields.map((f) => (
              <div key={f.label} className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">{f.label}</label>
                <Input
                  placeholder={f.placeholder}
                  className="bg-muted/40 border-0 focus-visible:ring-1 text-sm"
                />
              </div>
            ))}
          </div>

          <Button className="w-full bg-[var(--wave-teal)] hover:bg-[var(--wave-teal)]/90 text-white h-11 text-sm md:text-base font-semibold">
            <Zap className="w-4 h-4 mr-2" /> 빠르게 저장
          </Button>
        </CardContent>
      </Card>

      {/* Motivation banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] p-4 md:p-5 flex items-center justify-between gap-4 shadow-sm">
        <div>
          <p className="text-white font-semibold text-sm">오늘도 기록했다면, 내일도 할 수 있어요.</p>
          <p className="text-white/70 text-xs mt-0.5">연속 14일의 힘을 믿으세요.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="bg-white/15 text-white hover:bg-white/25 border-0 shrink-0 text-xs"
        >
          흐름 보기 →
        </Button>
      </div>
    </div>
  );
}
