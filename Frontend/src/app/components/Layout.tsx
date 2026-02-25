import { Outlet, Link, useLocation } from "react-router";
import {
  Home,
  Pill,
  Activity,
  Calendar,
  Phone,
  Heart,
  Menu,
} from "lucide-react";
import { useState } from "react";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/medications", label: "Medications", icon: Pill },
    { path: "/health", label: "Health Vitals", icon: Activity },
    { path: "/appointments", label: "Appointments", icon: Calendar },
    { path: "/activities", label: "Activities", icon: Heart },
    { path: "/emergency", label: "Emergency", icon: Phone },
    { path: "/caregiver", label: "Caregiver", icon: Menu },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">
              Seva Saati
            </h1>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              <Menu className="w-8 h-8" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Navigation */}
          <nav className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all text-lg ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden bg-white rounded-xl shadow-lg p-4 mb-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== "/" &&
                      location.pathname.startsWith(item.path));

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all text-lg ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md"
                            : "hover:bg-gray-100 text-gray-700"
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
