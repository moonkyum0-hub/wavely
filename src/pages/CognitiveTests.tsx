import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import { logCognitiveTest, getLatestCognitiveTest } from "@/lib/cognitiveService";
import type { CognitiveTestType } from "@/lib/models";

function toDateStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const TEST_META: Record<CognitiveTestType, { label: string; icon: string; desc: string; unit: string }> = {
  reaction:  { label: "반응속도", icon: "⚡", desc: "화면이 초록색으로 바뀌면 최대한 빨리 클릭해요", unit: "ms" },
  digitSpan: { label: "숫자기억", icon: "🔢", desc: "화면에 나온 숫자를 순서대로 기억해요", unit: "자리" },
  stroop:    { label: "스트룹",   icon: "🎨", desc: "단어가 아니라 글자의 색깔을 골라요", unit: "%" },
};

/* ── 반응속도 ─────────────────────────────────────────────── */
function ReactionTest({ onDone }: { onDone: (avgMs: number) => void }) {
  const TRIALS = 5;
  const [phase, setPhase] = useState<"idle" | "waiting" | "go" | "tooSoon">("idle");
  const [trialIndex, setTrialIndex] = useState(0);
  const timesRef = useRef<number[]>([]);
  const startTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  function beginTrial() {
    setPhase("waiting");
    const delay = 1000 + Math.random() * 2000;
    timerRef.current = window.setTimeout(() => {
      startTimeRef.current = performance.now();
      setPhase("go");
    }, delay);
  }

  function handleAreaClick() {
    if (phase === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setPhase("tooSoon");
      return;
    }
    if (phase === "go") {
      const rt = performance.now() - startTimeRef.current;
      timesRef.current = [...timesRef.current, rt];
      if (timesRef.current.length >= TRIALS) {
        const avg = Math.round(timesRef.current.reduce((a, b) => a + b, 0) / timesRef.current.length);
        onDone(avg);
      } else {
        setTrialIndex((i) => i + 1);
        beginTrial();
      }
    }
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-white/60 text-xs">{trialIndex + 1} / {TRIALS}회차</p>
      {phase === "idle" && (
        <button onClick={beginTrial} className="bg-white text-[#1e3a8a] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-colors">
          시작
        </button>
      )}
      {(phase === "waiting" || phase === "go") && (
        <button
          onClick={handleAreaClick}
          className={cn(
            "w-60 h-60 rounded-2xl flex items-center justify-center text-white font-bold text-base transition-colors",
            phase === "go" ? "bg-emerald-500" : "bg-rose-500/60"
          )}
        >
          {phase === "go" ? "지금 클릭!" : "기다려주세요..."}
        </button>
      )}
      {phase === "tooSoon" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-white text-sm">너무 빨랐어요, 초록색이 될 때까지 기다려주세요</p>
          <button onClick={beginTrial} className="bg-white/15 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-white/25 transition-colors">
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 숫자기억 ─────────────────────────────────────────────── */
function DigitSpanTest({ onDone }: { onDone: (maxSpan: number) => void }) {
  const MAX_SPAN = 9;
  const [span, setSpan] = useState(3);
  const [phase, setPhase] = useState<"showing" | "input">("showing");
  const [sequence, setSequence] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [input, setInput] = useState("");
  const lastCorrectRef = useRef(0);

  useEffect(() => {
    setSequence(Array.from({ length: span }, () => Math.floor(Math.random() * 10)));
    setDisplayIndex(0);
    setPhase("showing");
    setInput("");
  }, [span]);

  useEffect(() => {
    if (phase !== "showing") return;
    if (displayIndex >= sequence.length) {
      setPhase("input");
      return;
    }
    const t = setTimeout(() => setDisplayIndex((i) => i + 1), 800);
    return () => clearTimeout(t);
  }, [phase, displayIndex, sequence]);

  function submit() {
    const correct = input.trim() === sequence.join("");
    if (correct) {
      lastCorrectRef.current = span;
      if (span >= MAX_SPAN) {
        onDone(span);
      } else {
        setSpan((s) => s + 1);
      }
    } else {
      onDone(lastCorrectRef.current);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <p className="text-white/60 text-xs">{span}자리 숫자</p>
      {phase === "showing" ? (
        <div className="w-48 h-24 flex items-center justify-center">
          <span className="text-white text-4xl font-bold tracking-widest">
            {displayIndex < sequence.length ? sequence[displayIndex] : ""}
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          <p className="text-white/60 text-xs">순서대로 입력해주세요</p>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ""))}
            autoFocus
            className="text-center text-lg tracking-widest bg-white/10 border-white/20 text-white placeholder:text-white/30"
          />
          <button
            onClick={submit}
            disabled={!input}
            className="bg-white text-[#1e3a8a] font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-white/90 disabled:opacity-40 transition-colors"
          >
            확인
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 스트룹 ─────────────────────────────────────────────── */
const STROOP_COLORS = [
  { id: "red",    label: "빨강", hex: "#ef4444" },
  { id: "blue",   label: "파랑", hex: "#3b82f6" },
  { id: "green",  label: "초록", hex: "#22c55e" },
  { id: "yellow", label: "노랑", hex: "#eab308" },
];

function randomStroopTrial() {
  const word = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
  const ink = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
  return { word, ink };
}

function StroopTest({ onDone }: { onDone: (accuracy: number, avgRtMs: number) => void }) {
  const TRIALS = 10;
  const [trialIndex, setTrialIndex] = useState(0);
  const [current, setCurrent] = useState(randomStroopTrial);
  const correctCountRef = useRef(0);
  const rtsRef = useRef<number[]>([]);
  const startRef = useRef(performance.now());

  useEffect(() => {
    startRef.current = performance.now();
  }, [trialIndex]);

  function handleAnswer(colorId: string) {
    const rt = performance.now() - startRef.current;
    const correct = colorId === current.ink.id;
    if (correct) {
      correctCountRef.current += 1;
      rtsRef.current.push(rt);
    }
    if (trialIndex + 1 >= TRIALS) {
      const accuracy = Math.round((correctCountRef.current / TRIALS) * 100);
      const avgRt = rtsRef.current.length
        ? Math.round(rtsRef.current.reduce((a, b) => a + b, 0) / rtsRef.current.length)
        : 0;
      onDone(accuracy, avgRt);
    } else {
      setTrialIndex((i) => i + 1);
      setCurrent(randomStroopTrial());
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-white/60 text-xs">{trialIndex + 1} / {TRIALS}</p>
      <p className="text-xs text-white/45">단어가 아니라 글자의 색깔을 고르세요</p>
      <div className="text-4xl font-bold" style={{ color: current.ink.hex }}>{current.word.label}</div>
      <div className="grid grid-cols-2 gap-3">
        {STROOP_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => handleAnswer(c.id)}
            className="w-24 h-14 rounded-xl font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ background: c.hex }}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── 메인 페이지 ─────────────────────────────────────────────── */
interface LatestResult { value: number; value2?: number; date: string }

export default function CognitiveTests() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [active, setActive] = useState<CognitiveTestType | null>(null);
  const [latest, setLatest] = useState<Partial<Record<CognitiveTestType, LatestResult>>>({});
  const [isLoading, setIsLoading] = useState(true);

  async function loadLatest() {
    setIsLoading(true);
    try {
      const [r, d, s] = await Promise.all([
        getLatestCognitiveTest("reaction"),
        getLatestCognitiveTest("digitSpan"),
        getLatestCognitiveTest("stroop"),
      ]);
      const next: Partial<Record<CognitiveTestType, LatestResult>> = {};
      if (r) next.reaction = { value: r.metricValue, date: r.date };
      if (d) next.digitSpan = { value: d.metricValue, date: d.date };
      if (s) next.stroop = { value: s.metricValue, value2: s.metricValue2, date: s.date };
      setLatest(next);
    } catch {
      // dev browser mode — no Tauri runtime
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { loadLatest(); }, []);

  async function handleDone(testType: CognitiveTestType, metricValue: number, metricValue2?: number) {
    try {
      await logCognitiveTest({ date: toDateStr(), testType, metricValue, metricValue2 });
    } catch {
      // dev browser mode — no Tauri runtime
    }
    setActive(null);
    loadLatest();
  }

  return (
    <div className="space-y-section max-w-2xl">
      <div>
        <h1 className="text-page font-bold text-foreground">인지 검사</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">오늘의 반응속도·기억력·집중력을 기록해요</p>
      </div>

      <div className="space-y-tight">
        {(Object.keys(TEST_META) as CognitiveTestType[]).map((type) => {
          const meta = TEST_META[type];
          const result = latest[type];
          return (
            <div key={type} className="rounded-xl border border-border/20 shadow-sm p-card bg-card flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl shrink-0">{meta.icon}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{meta.label}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                  {!isLoading && (
                    result ? (
                      <p className={cn("text-[11px] font-medium mt-1.5", isDark ? "text-blue-300" : "text-blue-600")}>
                        최근 기록 {result.value}{meta.unit}
                        {type === "stroop" && result.value2 != null ? ` · 평균 ${Math.round(result.value2)}ms` : ""}
                        {" "}({result.date})
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground/70 mt-1.5">아직 기록이 없어요</p>
                    )
                  )}
                </div>
              </div>
              <button
                onClick={() => setActive(type)}
                className={cn(
                  "shrink-0 text-xs font-semibold px-3 py-2 rounded-lg transition-colors",
                  isDark ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30" : "bg-[#1e3a8a]/8 text-[#1e3a8a] hover:bg-[#1e3a8a]/12"
                )}
              >
                측정하기
              </button>
            </div>
          );
        })}
      </div>

      {active && createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-[#0f1c3f] via-[#1e3a8a] to-[#2563eb] px-6">
          <button onClick={() => setActive(null)} className="absolute top-6 right-6 text-white/50 hover:text-white text-xs">
            닫기
          </button>
          <h2 className="text-white font-bold text-lg">{TEST_META[active].label} 측정</h2>
          {active === "reaction" && <ReactionTest onDone={(v) => handleDone("reaction", v)} />}
          {active === "digitSpan" && <DigitSpanTest onDone={(v) => handleDone("digitSpan", v)} />}
          {active === "stroop" && <StroopTest onDone={(acc, rt) => handleDone("stroop", acc, rt)} />}
        </div>,
        document.body
      )}
    </div>
  );
}
