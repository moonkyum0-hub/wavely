import { NavLink } from "react-router-dom";
import { LayoutDashboard, ClipboardList, BarChart3, Target, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "오늘의 흐름", icon: LayoutDashboard },
  { to: "/record", label: "건강 기록", icon: ClipboardList },
  { to: "/stats", label: "통계", icon: BarChart3 },
  { to: "/goals", label: "목표 설정", icon: Target },
  { to: "/settings", label: "설정", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col w-[200px] xl:w-[220px] min-h-screen bg-[#1e3a8a] shrink-0 sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 pt-6 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white text-lg font-bold shrink-0">
            〜
          </div>
          <div>
            <div className="text-white font-bold text-[15px] leading-tight">Wavely</div>
            <div className="text-white/50 text-[11px]">건강의 흐름</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] transition-all",
                isActive
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/60 hover:bg-white/8 hover:text-white/85 font-medium"
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* AI bubble */}
      <div className="px-3 pb-3">
        <div className="bg-white/10 rounded-xl p-3 text-[11px] text-white/65 leading-relaxed">
          "어제보다 0.1% 나아졌다면,<br />오늘도 충분히 잘 한 거예요."
        </div>
      </div>

      {/* User */}
      <div className="px-4 pt-3 pb-5 border-t border-white/10 flex items-center gap-2.5">
        <Avatar className="w-8 h-8 shrink-0">
          <AvatarFallback className="bg-blue-500 text-white text-xs font-bold">지</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="text-white text-[13px] font-semibold leading-tight truncate">김지현</div>
          <div className="text-white/50 text-[11px] mt-0.5">14일 연속 기록 중 🔥</div>
        </div>
      </div>
    </aside>
  );
}
