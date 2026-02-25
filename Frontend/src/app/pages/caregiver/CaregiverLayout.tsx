import { useEffect, useState } from "react";
import { Outlet, useNavigate, NavLink, useLocation } from "react-router";
import {
  ShieldCheck, LayoutDashboard, Pill, Activity,
  ClipboardList, LogOut, User, RefreshCw, ChevronRight,
} from "lucide-react";

interface CaregiverSession {
  name: string;
  username: string;
  loginAt: string;
}

const navItems = [
  { path: "/caregiver/dashboard",   label: "Overview",    icon: LayoutDashboard },
  { path: "/caregiver/medications", label: "Medications", icon: Pill            },
  { path: "/caregiver/vitals",      label: "Health Vitals", icon: Activity       },
  { path: "/caregiver/checkins",    label: "Check-ins",   icon: ClipboardList   },
];

export function CaregiverLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<CaregiverSession | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = sessionStorage.getItem("caregiver_auth");
    if (!stored) {
      navigate("/caregiver/login", { replace: true });
      return;
    }
    setSession(JSON.parse(stored));
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem("caregiver_auth");
    navigate("/caregiver/login", { replace: true });
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Dispatch a custom event that child pages can listen to
    window.dispatchEvent(new CustomEvent("caregiver-refresh"));
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Sidebar ── */}
      <aside className="w-72 bg-slate-900 flex flex-col shadow-2xl flex-shrink-0">

        {/* Branding */}
        <div className="p-7 border-b border-white/10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 bg-blue-500/20 border border-blue-400/40 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">Seva Saati</h1>
              <p className="text-blue-400 text-sm font-medium">Caregiver Portal</p>
            </div>
          </div>
        </div>

        {/* Logged-in caregiver */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/40 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <p className="text-white text-base font-semibold">{session.name}</p>
              <p className="text-white/40 text-sm">
                Since {new Date(session.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg font-semibold transition-all ${
                  active
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-6 h-6 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-4 h-4 opacity-70" />}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="p-5 border-t border-white/10 space-y-2">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all text-lg font-semibold"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Refresh Data</span>
            <span className="ml-auto text-xs text-white/30">
              {lastRefresh.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all text-lg font-semibold"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
          <a
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:text-white/60 transition-all text-base"
          >
            ← Patient App
          </a>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
