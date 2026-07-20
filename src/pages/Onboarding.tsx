import { useState } from "react";
import { cn } from "@/lib/utils";
import WavelyLogo from "@/components/WavelyLogo";
import { createGoal } from "@/lib/goalService";
import {
  PERSONAS, PERSONA_GOAL_TEMPLATE, DEFAULT_GOAL_TEMPLATE,
  ONBOARDING_COMPLETE_KEY, ONBOARDING_PERSONA_KEY, type PersonaId,
} from "@/lib/goalTemplates";

const CONCEPT_POINTS = [
  {
    icon: "🌊",
    title: "완벽한 하루 대신, 흐름을 봐요",
    body: "매일 100점일 필요 없어요. 오르내림은 자연스러운 거고, Wavely는 그 흐름을 함께 지켜봐요.",
  },
  {
    icon: "📊",
    title: "파도 점수 = 수면·운동·수분·컨디션",
    body: "네 가지를 하나의 숫자로 합쳐서, 오늘 상태를 한눈에 확인할 수 있어요.",
  },
  {
    icon: "🎯",
    title: "지금 선택은 시작점일 뿐이에요",
    body: "목표는 목표 설정 페이지에서, 유형은 설정에서 언제든 다시 바꿀 수 있어요.",
  },
];

const STEPS = ["welcome", "concept", "persona"] as const;
type Step = (typeof STEPS)[number];

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [isSaving, setIsSaving] = useState(false);
  const stepIndex = STEPS.indexOf(step);

  async function finish(persona: PersonaId | null) {
    setIsSaving(true);
    const template = persona ? PERSONA_GOAL_TEMPLATE[persona] : DEFAULT_GOAL_TEMPLATE;
    try {
      for (const g of template) await createGoal(g);
    } catch {
      // dev browser mode — no Tauri runtime
    }
    try {
      localStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
      if (persona) localStorage.setItem(ONBOARDING_PERSONA_KEY, persona);
    } catch {
      // localStorage unavailable
    }
    setIsSaving(false);
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-gradient-to-br from-[#0f1c3f] via-[#1e3a8a] to-[#2563eb] px-6 text-center">
      {step !== "welcome" && (
        <div className="absolute top-8 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === stepIndex ? "w-6 bg-white" : "w-1.5 bg-white/30"
              )}
            />
          ))}
        </div>
      )}

      {step === "welcome" && (
        <>
          <WavelyLogo size={52} />
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">Wavely에 오신 걸 환영해요</h1>
            <p className="text-white/60 text-sm">완벽한 하루 대신, 흘러가는 파도처럼.</p>
          </div>
          <button
            onClick={() => setStep("concept")}
            className="bg-white text-[#1e3a8a] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            시작하기
          </button>
        </>
      )}

      {step === "concept" && (
        <>
          <div>
            <h1 className="text-white font-bold text-xl mb-1.5">Wavely는 이렇게 동작해요</h1>
            <p className="text-white/60 text-sm">30초면 충분해요</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            {CONCEPT_POINTS.map((c) => (
              <div key={c.title} className="flex items-start gap-3 bg-white/10 rounded-xl px-4 py-3.5 text-left">
                <span className="text-xl shrink-0">{c.icon}</span>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm">{c.title}</div>
                  <div className="text-white/55 text-xs mt-0.5 leading-relaxed">{c.body}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setStep("persona")}
            className="bg-white text-[#1e3a8a] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            다음
          </button>
        </>
      )}

      {step === "persona" && (
        <>
          <div>
            <h1 className="text-white font-bold text-xl mb-1.5">어떤 상황이신가요?</h1>
            <p className="text-white/60 text-sm">선택에 맞춰 시작 목표를 준비해드려요</p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => finish(p.id)}
                disabled={isSaving}
                className="flex items-center gap-3 bg-white/10 hover:bg-white/15 disabled:opacity-50 rounded-xl px-4 py-3.5 text-left transition-colors"
              >
                <span className="text-2xl shrink-0">{p.emoji}</span>
                <div className="min-w-0">
                  <div className="text-white font-semibold text-sm">{p.label}</div>
                  <div className="text-white/55 text-xs mt-0.5 leading-relaxed">{p.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep("concept")}
              disabled={isSaving}
              className="text-white/50 text-xs hover:text-white/75 transition-colors disabled:opacity-50"
            >
              이전
            </button>
            <button
              onClick={() => finish(null)}
              disabled={isSaving}
              className="text-white/50 text-xs hover:text-white/75 transition-colors disabled:opacity-50"
            >
              건너뛰고 기본값으로 시작
            </button>
          </div>
        </>
      )}
    </div>
  );
}
