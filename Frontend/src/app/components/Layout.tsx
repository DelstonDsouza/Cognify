import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Home, Pill, Activity, Calendar, Phone, Heart, Menu, LogOut, X } from "lucide-react";
import { useState } from "react";

const ELDER_SESSION_KEY = "elder_session";

const navItems = [
  { path: "/dashboard",              label: "Home",          icon: Home     },
  { path: "/dashboard/medications",  label: "Medications",   icon: Pill     },
  { path: "/dashboard/health",       label: "Health Vitals", icon: Activity },
  { path: "/dashboard/appointments", label: "Appointments",  icon: Calendar },
  { path: "/dashboard/activities",   label: "Activities",    icon: Heart    },
  { path: "/dashboard/emergency",    label: "Emergency",     icon: Phone    },
  { path: "/dashboard/caregiver",    label: "Caregiver",     icon: Menu     },
];

export function Layout() {
  const location  = useLocation();
  const navigate  = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem(ELDER_SESSION_KEY);
    navigate("/login", { replace: true });
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">

      {/* Header — logo + mobile menu toggle only, no logout here */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Seva Saati</h1>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
              {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Desktop Sidebar */}
          <nav className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link to={item.path}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all text-lg ${
                          isActive(item.path)
                            ? "bg-blue-600 text-white shadow-md"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}>
                        <Icon className="w-6 h-6" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <button onClick={handleLogout}
                className="mt-4 w-full flex items-center gap-3 p-4 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-all text-lg">
                <LogOut className="w-6 h-6" /><span>Logout</span>
              </button>
            </div>
          </nav>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="lg:hidden bg-white rounded-xl shadow-lg p-4 mb-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.path}>
                      <Link to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all text-lg ${
                          isActive(item.path)
                            ? "bg-blue-600 text-white shadow-md"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}>
                        <Icon className="w-6 h-6" /><span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 rounded-lg text-red-400 hover:bg-red-50 text-lg">
                    <LogOut className="w-6 h-6" /><span>Logout</span>
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}