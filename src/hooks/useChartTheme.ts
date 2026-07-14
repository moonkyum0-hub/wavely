import { useTheme } from "@/context/ThemeContext";

export function useChartTheme() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return {
    isDark,
    bg: isDark ? "#0d1b30" : "#ffffff",
    tick: isDark ? "#6a9ab8" : "#94a3b8",
    grid: isDark ? "#162840" : "#f1f5f9",
    tooltip: {
      backgroundColor: isDark ? "#0d1b30" : "#ffffff",
      color: isDark ? "#ddeeff" : "#0f172a",
      borderRadius: 8,
      border: isDark ? "1px solid #1a3050" : "none",
      fontSize: 12,
      boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.08)",
    },
    polarGrid: isDark ? "#162840" : "#e2e8f0",
    polarAxis: isDark ? "#507090" : "#64748b",
    blue: isDark ? "#60a5fa" : "#3b82f6",
    emerald: isDark ? "#34d399" : "#059669",
    violet: isDark ? "#a78bfa" : "#7c3aed",
  };
}
