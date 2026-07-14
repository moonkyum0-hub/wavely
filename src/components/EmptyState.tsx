import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
  };
  compact?: boolean;
}

export default function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-4" : "py-14 px-6"
    )}>
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4",
        isDark ? "bg-[#112030]" : "bg-slate-50 border border-slate-100"
      )}>
        {icon}
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px] mt-0.5">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "mt-4 px-4 py-2 rounded-lg text-xs font-semibold transition-colors",
            isDark
              ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
              : "bg-[#1e3a8a]/8 text-[#1e3a8a] hover:bg-[#1e3a8a]/12"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
