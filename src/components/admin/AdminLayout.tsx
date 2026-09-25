import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, User, BookOpen, Code2, FolderGit2, Trophy,
  Route, FileText, Settings, LogOut, Menu, X,
} from "lucide-react";

const LINKS = [
  { to: "/admin",             icon: LayoutDashboard, label: "Dashboard",  end: true },
  { to: "/admin/profile",     icon: User,           label: "Profile" },
  { to: "/admin/about",       icon: BookOpen,       label: "About" },
  { to: "/admin/skills",      icon: Code2,          label: "Skills" },
  { to: "/admin/projects",    icon: FolderGit2,     label: "Projects" },
  { to: "/admin/achievements",icon: Trophy,         label: "Achievements" },
  { to: "/admin/journey",     icon: Route,          label: "Journey" },
  { to: "/admin/resume",      icon: FileText,       label: "Resume" },
  { to: "/admin/settings",    icon: Settings,       label: "Settings" },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const logout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-[#08090c] text-[#e8eaf0]">
      {/* ── mobile overlay ── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* ── sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[rgba(255,255,255,0.08)] bg-[#0e1015] transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.08)] px-5">
          <span className="text-sm font-semibold tracking-wide uppercase" style={{ fontFamily: "'Space Grotesk',sans-serif" }}>
            Admin
          </span>
          <button onClick={() => setOpen(false)} className="lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {LINKS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[rgba(91,108,255,0.12)] text-[#8b99ff]"
                    : "text-[#8a90a2] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e8eaf0]"
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[rgba(255,255,255,0.08)] p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-[#8a90a2] transition-colors hover:bg-[rgba(255,255,255,0.04)] hover:text-[#e8eaf0]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-center text-xs text-[#5a6072] hover:text-[#8b99ff]"
          >
            View Public Site →
          </a>
        </div>
      </aside>

      {/* ── main area ── */}
      <div className="flex flex-1 flex-col">
        {/* top bar */}
        <header className="flex h-16 items-center gap-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0e1015] px-5">
          <button onClick={() => setOpen(true)} className="lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm text-[#8a90a2]">Portfolio Admin</span>
        </header>

        {/* page content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
