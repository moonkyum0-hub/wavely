import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-background font-sans">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8 min-w-0">
        <div key={pathname} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  );
}
