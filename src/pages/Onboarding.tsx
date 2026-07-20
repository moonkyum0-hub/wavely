import { useState } from "react";
import WavelyLogo from "@/components/WavelyLogo";
import { createGoal } from "@/lib/goalService";
import { PERSONAS, PERSONA_GOAL_TEMPLATE, DEFAULT_GOAL_TEMPLATE, type PersonaId } from "@/lib/goalTemplates";

export const ONBOARDING_COMPLETE_KEY = "wavely-onboarding-complete";
export const ONBOARDING_PERSONA_KEY = "wavely-persona";

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<"welcome" | "persona">("welcome");
  const [isSaving, setIsSaving] = useState(false);

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
      {step === "welcome" ? (
        <>
          <WavelyLogo size={52} />
          <div>
            <h1 className="text-white font-bold text-2xl mb-2">Wavely에 오신 걸 환영해요</h1>
            <p className="text-white/60 text-sm">완벽한 하루 대신, 흘러가는 파도처럼.</p>
          </div>
          <button
            onClick={() => setStep("persona")}
            className="bg-white text-[#1e3a8a] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
          >
            시작하기
          </button>
        </>
      ) : (
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
          <button
            onClick={() => finish(null)}
            disabled={isSaving}
            className="text-white/50 text-xs hover:text-white/75 transition-colors disabled:opacity-50"
          >
            건너뛰고 기본값으로 시작
          </button>
        </>
      )}
    </div>
  );
}
