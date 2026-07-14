import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        isDark ? "bg-[#1a3050]/60" : "bg-slate-200/80",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/20 shadow-sm p-card bg-card space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  );
}

export function ChartCardSkeleton({ height = 160 }: { height?: number }) {
  return (
    <div className="rounded-xl bg-card border border-border/20 shadow-sm overflow-hidden">
      <div className="px-card pt-section pb-item border-b border-border/40 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="p-4">
        <div className="w-full rounded-lg" style={{ height }}>
          <Skeleton className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}

export function LogItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-card py-item">
      <Skeleton className="w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function GoalCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/20 shadow-sm px-card py-item bg-card">
      <div className="flex items-center gap-3">
        <Skeleton className="w-6 h-6 rounded-md shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-9 shrink-0" />
      </div>
    </div>
  );
}
