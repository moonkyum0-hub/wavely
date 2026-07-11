import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "홈", icon: LayoutDashboard },
  { to: "/record", label: "기록", icon: ClipboardList },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/goals", label: "목표", icon: Target },
  { to: "/settings", label: "설정", icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border flex md:hidden">
      {nav.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            cn(
              "flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-medium transition-colors",
              isActive ? "text-[var(--wave-navy)]" : "text-muted-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
