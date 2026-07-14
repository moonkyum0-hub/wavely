import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, X, Clock, ChevronRight, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";
import {
  EXERCISES, CATEGORY_LABEL, CATEGORY_COLOR, CATEGORY_ORDER,
  getGifUrl, type Exercise, type ExerciseCategory,
} from "@/lib/exerciseData";

/* ── Category icon SVG paths ─────────────────────────────────────── */
const CAT_ICON_PATH: Record<ExerciseCategory, string> = {
  CORE:        "M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2v7M8 10h8M9 21l3-7 3 7",
  UPPER:       "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2v6M5 9l7-1 7 1M12 12l-3 9M12 12l3 9",
  LOWER:       "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2v6M9 21l2-9h2l2 9M9 21h2M13 21h2",
  FLEXIBILITY: "M6 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 7c0 5 4 6 9 7s5 6 5 6M16 13l4 1",
  CARDIO:      "M3 12h4l2 6 4-12 2 6h6",
};

function CategorySvg({ category, className }: { category: ExerciseCategory; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className}>
      {CAT_ICON_PATH[category].split("M").filter(Boolean).map((seg, i) => (
        <path key={i} d={`M${seg}`} />
      ))}
    </svg>
  );
}

/* ── Exercise card ───────────────────────────────────────────────── */
function ExerciseCard({ ex, isDark, onClick }: { ex: Exercise; isDark: boolean; onClick: () => void }) {
  const cat = CATEGORY_COLOR[ex.category];
  const thumbnail = getGifUrl(ex.name);

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl overflow-hidden border transition-all duration-200 group",
        "hover:shadow-lg hover:-translate-y-0.5",
        isDark
          ? "bg-card border-border/20 hover:border-border/50"
          : "bg-white border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-blue-100/60"
      )}
    >
      {/* Thumbnail */}
      <div className={cn(
        "relative h-28 flex items-center justify-center overflow-hidden",
        isDark ? "bg-[#070f1e]" : "bg-gradient-to-br from-slate-50 to-blue-50/40"
      )}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={ex.name}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <Dumbbell className="w-8 h-8 text-muted-foreground/30" />
        )}
        <span className={cn(
          "absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white",
          cat.bg
        )}>
          {CATEGORY_LABEL[ex.category]}
        </span>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1 mb-1">
          <h3 className="text-xs font-bold text-foreground leading-snug">{ex.name}</h3>
          <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0 mt-0.5 group-hover:text-muted-foreground transition-colors" />
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5" />
            {ex.durationMin}분
          </span>
          {ex.setsReps && (
            <span className="truncate">{ex.setsReps}</span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Exercise detail modal ───────────────────────────────────────── */
function ExerciseModal({ ex, isDark, onClose }: { ex: Exercise; isDark: boolean; onClose: () => void }) {
  const cat = CATEGORY_COLOR[ex.category];
  const gif = getGifUrl(ex.name);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden",
          "max-h-[92vh] overflow-y-auto",
          isDark ? "bg-card" : "bg-white"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* GIF header */}
        <div className={cn(
          "relative flex items-center justify-center",
          isDark ? "bg-[#070f1e]" : "bg-gradient-to-br from-slate-50 to-blue-50/50",
          "h-56 sm:h-64"
        )}>
          {gif ? (
            <img src={gif} alt={ex.name} className="w-full h-full object-contain" />
          ) : (
            <Dumbbell className="w-16 h-16 text-muted-foreground/20" />
          )}
          <button
            onClick={onClose}
            className={cn(
              "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
              isDark ? "bg-white/10 hover:bg-white/20 text-white" : "bg-black/10 hover:bg-black/20 text-slate-700"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Title + badge */}
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-bold text-foreground">{ex.name}</h2>
            <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full text-white shrink-0", cat.bg)}>
              {CATEGORY_LABEL[ex.category]}
            </span>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4">
            <span className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg",
              isDark ? "bg-[#112030] text-muted-foreground" : "bg-slate-100 text-slate-600"
            )}>
              <Clock className="w-3.5 h-3.5" /> {ex.durationMin}분
            </span>
            {ex.setsReps && (
              <span className={cn(
                "text-xs font-medium px-2.5 py-1.5 rounded-lg",
                isDark ? "bg-[#112030] text-muted-foreground" : "bg-slate-100 text-slate-600"
              )}>
                {ex.setsReps}
              </span>
            )}
          </div>

          {/* Sections */}
          {[
            { label: "운동 설명", text: ex.description },
            { label: "기대 효과", text: ex.benefit },
            { label: "운동 포인트", text: ex.cue },
          ].map(({ label, text }) => (
            <div key={label}>
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-widest mb-1.5",
                isDark ? "text-blue-400/70" : "text-muted-foreground"
              )}>
                {label}
              </p>
              <p className="text-sm text-foreground leading-relaxed">{text}</p>
            </div>
          ))}

          {/* CTA */}
          <button className={cn(
            "w-full py-3 rounded-xl text-sm font-bold transition-colors mt-2",
            isDark
              ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
              : "bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90"
          )}>
            루틴에 추가하기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function ExerciseCatalog() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<ExerciseCategory | "ALL">("ALL");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchCat = activeCat === "ALL" || ex.category === activeCat;
      const matchQuery = query.trim() === "" ||
        ex.name.includes(query) ||
        ex.description.includes(query) ||
        CATEGORY_LABEL[ex.category].includes(query);
      return matchCat && matchQuery;
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    if (activeCat !== "ALL") return null;
    return CATEGORY_ORDER.map((cat) => ({
      cat,
      items: filtered.filter((ex) => ex.category === cat),
    })).filter((g) => g.items.length > 0);
  }, [filtered, activeCat]);

  return (
    <div className="space-y-section">
      {/* Header */}
      <div>
        <h1 className="text-page font-bold text-foreground">운동 카탈로그</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Wavely에 맞는 운동을 찾아 루틴을 만들어보세요
        </p>
      </div>

      {/* Search + filter */}
      <div className="space-y-3">
        {/* Search */}
        <div className={cn(
          "flex items-center gap-2 rounded-xl px-3 py-2.5 border transition-colors",
          isDark
            ? "bg-[#0d1b30] border-border/20 focus-within:border-blue-500/50"
            : "bg-white border-slate-200 shadow-sm focus-within:border-blue-300"
        )}>
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="운동 이름, 카테고리 검색..."
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCat("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              activeCat === "ALL"
                ? isDark ? "bg-blue-500 text-white" : "bg-[#1e3a8a] text-white"
                : isDark ? "bg-[#112030] text-muted-foreground hover:text-foreground" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            전체 {EXERCISES.length}
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const count = EXERCISES.filter((e) => e.category === cat).length;
            const active = activeCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                  active
                    ? `${CATEGORY_COLOR[cat].bg} text-white`
                    : isDark
                      ? "bg-[#112030] text-muted-foreground hover:text-foreground"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <CategorySvg category={cat} className="w-3 h-3" />
                {CATEGORY_LABEL[cat]} {count}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercise grid */}
      {filtered.length === 0 ? (
        <div className={cn(
          "rounded-2xl border border-border/20 py-16 flex flex-col items-center gap-3",
          isDark ? "bg-card" : "bg-white shadow-sm"
        )}>
          <Search className="w-8 h-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold text-foreground">검색 결과가 없어요</p>
          <p className="text-xs text-muted-foreground">다른 키워드로 검색해보세요</p>
        </div>
      ) : grouped ? (
        /* Grouped by category */
        <div className="space-y-8">
          {grouped.map(({ cat, items }) => (
            <section key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <CategorySvg category={cat} className={cn("w-4 h-4", CATEGORY_COLOR[cat].text)} />
                <h2 className="text-section font-bold text-foreground">{CATEGORY_LABEL[cat]}</h2>
                <span className="text-xs text-muted-foreground ml-0.5">{items.length}개</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-item">
                {items.map((ex) => (
                  <ExerciseCard key={ex.name} ex={ex} isDark={isDark} onClick={() => setSelected(ex)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        /* Flat grid when filtered */
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-item">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.name} ex={ex} isDark={isDark} onClick={() => setSelected(ex)} />
          ))}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <ExerciseModal ex={selected} isDark={isDark} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
