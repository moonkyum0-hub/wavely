import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Target, Settings, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "홈", icon: LayoutDashboard },
  { to: "/record", label: "기록", icon: ClipboardList },
  { to: "/exercise", label: "운동", icon: Dumbbell },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/goals", label: "목표", icon: Target },
  { to: "/settings", label: "설정", icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e3a8a] flex md:hidden safe-area-inset-bottom">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium transition-colors",
              isActive ? "text-white" : "text-white/50"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                isActive ? "bg-white/20" : "bg-transparent"
              )}>
                <Icon className={cn("w-4.5 h-4.5", isActive ? "stroke-[2.5px]" : "stroke-[1.5px]")} style={{ width: 18, height: 18 }} />
              </div>
              <span>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
