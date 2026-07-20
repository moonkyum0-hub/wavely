import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Database, Shield, ChevronRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import { getRecords } from "@/lib/healthService";
import { PERSONAS, ONBOARDING_PERSONA_KEY, type PersonaId } from "@/lib/goalTemplates";
import type { HealthRecord } from "@/lib/models";

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function toCsv(records: HealthRecord[]): string {
  const header = ["date", "sleepHours", "exerciseMin", "waterMl", "condition", "waveScore", "note"];
  const rows = records.map((r) => [
    r.date, r.sleepHours ?? "", r.exerciseMin ?? "", r.waterMl ?? "", r.condition ?? "", r.waveScore ?? "",
    (r.note ?? "").replace(/"/g, '""'),
  ].map((v) => (typeof v === "string" && (v.includes(",") || v.includes("\n")) ? `"${v}"` : v)).join(","));
  return [header.join(","), ...rows].join("\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const { show: showToast } = useToast();
  const [streakCount, setStreakCount] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [persona, setPersonaState] = useState<PersonaId | null>(() => {
    try {
      return (localStorage.getItem(ONBOARDING_PERSONA_KEY) as PersonaId | null) ?? null;
    } catch {
      return null;
    }
  });

  function selectPersona(id: PersonaId | null) {
    try {
      if (id) localStorage.setItem(ONBOARDING_PERSONA_KEY, id);
      else localStorage.removeItem(ONBOARDING_PERSONA_KEY);
    } catch {
      // localStorage unavailable
    }
    setPersonaState(id);
    const label = id ? PERSONAS.find((p) => p.id === id)?.label : "선택 안 함";
    showToast(`유형을 "${label}"(으)로 바꿨어요. 새 목표는 목표 설정 페이지에서 추가할 수 있어요.`, "info");
  }

  useEffect(() => {
    (async () => {
      try {
        const recs = await getRecords("2000-01-01", toDateStr(new Date()));
        const byDate = new Set(recs.map((r) => r.date));
        let count = 0;
        const d = new Date();
        if (!byDate.has(toDateStr(d))) d.setDate(d.getDate() - 1);
        while (byDate.has(toDateStr(d))) {
          count++;
          d.setDate(d.getDate() - 1);
        }
        setStreakCount(count);
      } catch {
        // dev browser mode — no Tauri runtime
      }
    })();
  }, []);

  async function handleExport() {
    setIsExporting(true);
    try {
      const recs = await getRecords("2000-01-01", toDateStr(new Date()));
      downloadCsv(toCsv(recs), `wavely-health-records-${toDateStr(new Date())}.csv`);
    } catch {
      // dev browser mode — no Tauri runtime
    } finally {
      setIsExporting(false);
    }
  }

  type MenuItem = {
    icon: typeof Bell;
    label: string;
    sub: string;
    action: "toggle" | "arrow" | "none";
    danger?: boolean;
    onClick?: () => void;
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "알림",
      items: [
        { icon: Bell, label: "일일 리마인더", sub: "매일 오전 8시", action: "toggle" },
        { icon: Bell, label: "목표 달성 알림", sub: "목표 완료 시 알림", action: "toggle" },
      ],
    },
    {
      title: "데이터",
      items: [
        { icon: Database, label: isExporting ? "내보내는 중..." : "데이터 내보내기", sub: "CSV 파일로 다운로드", action: "arrow", onClick: handleExport },
        { icon: Database, label: "데이터 초기화", sub: "모든 기록을 삭제합니다", action: "arrow", danger: true },
      ],
    },
    {
      title: "앱 정보",
      items: [
        { icon: Shield, label: "개인정보 처리방침", sub: "", action: "arrow" },
        { icon: Shield, label: "버전", sub: "0.1.0 (개발 중)", action: "none" },
      ],
    },
  ];

  return (
    <div className="space-y-section max-w-2xl">
      <div>
        <h1 className="text-page font-bold text-foreground">설정</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">프로필, 알림, 데이터 관리</p>
      </div>

      {/* Profile card */}
      <div className="rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#2563eb] p-card shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
          지
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-bold text-base">김지현</div>
          <div className="text-white/60 text-xs mt-0.5">
            {streakCount != null ? `${streakCount}일 연속 기록 중 🔥` : "기록을 시작해보세요"} · Wavely 사용자
          </div>
        </div>
        <button className="shrink-0 bg-white/15 hover:bg-white/25 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
          편집
        </button>
      </div>

      {/* Dark mode toggle */}
      <div className="rounded-xl border border-border/20 shadow-sm overflow-hidden">
        <div className={`${isDark ? "bg-black/15" : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent"} px-card pt-section pb-item border-b border-border/50`}>
          <h3 className="text-section font-bold text-foreground">화면 설정</h3>
        </div>
        <div className="bg-card px-card py-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark"
                ? <Moon className="w-4.5 h-4.5 text-blue-400" style={{ width: 18, height: 18 }} />
                : <Sun className="w-4.5 h-4.5 text-amber-500" style={{ width: 18, height: 18 }} />
              }
              <div>
                <div className="text-sm font-semibold text-foreground">
                  {theme === "dark" ? "다크 모드" : "라이트 모드"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {theme === "dark" ? "어두운 화면으로 눈의 피로를 줄여요" : "밝은 화면으로 선명하게 봐요"}
                </div>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={toggle}
              className={cn(
                "relative w-11 h-6 rounded-full overflow-hidden shrink-0 transition-colors duration-200 focus:outline-none",
                theme === "dark" ? "bg-blue-500" : "bg-muted-foreground/30"
              )}
            >
              <span className={cn(
                "absolute top-0.5 left-0 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200",
                theme === "dark" ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
          {/* Theme preview chips */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => theme === "dark" && toggle()}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                theme === "light"
                  ? isDark ? "border-blue-500 bg-blue-950/30 text-blue-300" : "border-[#1e3a8a] bg-blue-50 text-[#1e3a8a]"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <Sun className="w-3.5 h-3.5" /> 라이트
            </button>
            <button
              onClick={() => theme === "light" && toggle()}
              className={cn(
                "flex-1 py-3 rounded-xl border-2 text-xs font-semibold transition-all flex items-center justify-center gap-1.5",
                theme === "dark"
                  ? "border-blue-500 bg-blue-950/30 text-blue-300"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <Moon className="w-3.5 h-3.5" /> 다크
            </button>
          </div>
        </div>
      </div>

      {/* Persona / user type */}
      <div className="rounded-xl border border-border/20 shadow-sm overflow-hidden">
        <div className={`${isDark ? "bg-black/15" : "bg-gradient-to-r from-[#1e3a8a]/5 to-transparent"} px-card pt-section pb-item border-b border-border/50`}>
          <h3 className="text-section font-bold text-foreground">내 유형</h3>
          <p className="text-xs text-muted-foreground mt-0.5">선택한 유형에 따라 새 목표 추천이 달라져요</p>
        </div>
        <div className="bg-card px-card py-section flex flex-wrap gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => selectPersona(p.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors border",
                persona === p.id
                  ? isDark ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-[#1e3a8a]/8 border-[#1e3a8a]/30 text-[#1e3a8a]"
                  : "border-border text-muted-foreground hover:border-muted-foreground/50"
              )}
            >
              <span>{p.emoji}</span> {p.label}
            </button>
          ))}
          <button
            onClick={() => selectPersona(null)}
            className={cn(
              "px-3 py-2 rounded-lg text-xs font-semibold transition-colors border",
              persona === null
                ? isDark ? "bg-blue-500/20 border-blue-500/40 text-blue-300" : "bg-[#1e3a8a]/8 border-[#1e3a8a]/30 text-[#1e3a8a]"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            선택 안 함
          </button>
        </div>
      </div>

      {/* Other settings sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="rounded-xl border border-border/20 shadow-sm overflow-hidden">
          <div className="bg-muted/30 px-card py-item border-b border-border/50">
            <h3 className="text-label font-semibold text-muted-foreground uppercase">{section.title}</h3>
          </div>
          <div className="bg-card divide-y divide-border/50">
            {section.items.map((item, i) => (
              <div
                key={i}
                onClick={item.onClick}
                className={cn(
                  "flex items-center gap-3 px-card py-item",
                  item.action !== "none" && "cursor-pointer hover:bg-muted/30 transition-colors"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", item.danger ? "text-rose-500" : "text-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className={cn("text-sm font-medium", item.danger ? (isDark ? "text-rose-400" : "text-rose-600") : "text-foreground")}>
                    {item.label}
                  </div>
                  {item.sub && <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>}
                </div>
                {item.action === "arrow" && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                {item.action === "toggle" && (
                  <div className={`w-9 h-5 rounded-full relative shrink-0 ${isDark ? "bg-[#1e3a5c]/60" : "bg-muted-foreground/20"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm ${isDark ? "bg-[#3d6080]" : "bg-white"}`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
