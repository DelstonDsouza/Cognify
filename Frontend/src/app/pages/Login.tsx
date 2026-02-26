import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { login as caregiverLogin, isLoggedIn } from "../../utils/caregiverAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Simple elder auth (localStorage) ─────────────────────────────────────────
const ELDER_KEY = "elder_accounts";
const ELDER_SESSION_KEY = "elder_session";

interface ElderAccount {
  fullName: string;
  username: string;
  passwordHash: string;
  registeredAt: string;
}

function hashPassword(p: string): string {
  return btoa(unescape(encodeURIComponent(p)));
}

function getElders(): ElderAccount[] {
  try { return JSON.parse(localStorage.getItem(ELDER_KEY) || "[]"); }
  catch { return []; }
}

function registerElder(fullName: string, username: string, password: string) {
  const elders = getElders();
  const uname  = username.trim().toLowerCase();
  if (elders.some(e => e.username === uname))
    return { success: false, error: "Username already taken." };
  elders.push({ fullName: fullName.trim(), username: uname, passwordHash: hashPassword(password), registeredAt: new Date().toISOString() });
  localStorage.setItem(ELDER_KEY, JSON.stringify(elders));
  localStorage.setItem(ELDER_SESSION_KEY, JSON.stringify({ fullName: fullName.trim(), username: uname }));
  return { success: true };
}

function loginElder(username: string, password: string) {
  const elders = getElders();
  const elder  = elders.find(e => e.username === username.trim().toLowerCase());
  if (!elder) return { success: false, error: "No account found." };
  if (elder.passwordHash !== hashPassword(password)) return { success: false, error: "Incorrect password." };
  localStorage.setItem(ELDER_SESSION_KEY, JSON.stringify({ fullName: elder.fullName, username: elder.username }));
  return { success: true };
}

export function isElderLoggedIn(): boolean {
  try { return !!JSON.parse(localStorage.getItem(ELDER_SESSION_KEY) || "null"); }
  catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────

type Tab = "elder" | "caregiver";
type ElderMode = "login" | "register";

export function Login() {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState<Tab>("elder");
  const [elderMode, setElderMode] = useState<ElderMode>("login");

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    if (isElderLoggedIn()) navigate("/dashboard", { replace: true });
    if (isLoggedIn())      navigate("/caregiver-portal/dashboard", { replace: true });
  }, [navigate]);

  const reset = () => {
    setFullName(""); setUsername(""); setPassword(""); setConfirm(""); setError("");
  };

  const handleElder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (elderMode === "register") {
      if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
      if (password !== confirm)  { setError("Passwords do not match."); return; }
      const r = registerElder(fullName, username, password);
      if (!r.success) { setError(r.error || "Registration failed."); return; }
      navigate("/dashboard", { replace: true });
    } else {
      const r = loginElder(username, password);
      if (!r.success) { setError(r.error || "Login failed."); return; }
      navigate("/dashboard", { replace: true });
    }
  };

  const handleCaregiver = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await caregiverLogin(username, password);
    if (result.success) {
      navigate("/caregiver-portal/dashboard", { replace: true });
    } else {
      setError(result.error || "Login failed.");
    }
    setLoading(false);
  };

  const switchTab  = (t: Tab)       => { setTab(t);       reset(); };
  const switchMode = (m: ElderMode) => { setElderMode(m); reset(); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-10">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-extrabold text-gray-800 tracking-tight">Seva Saati</h1>
          <p className="text-gray-400 mt-2 text-2xl">Your health companion</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-10">
          <button
            onClick={() => switchTab("elder")}
            className={`flex-1 py-4 rounded-xl text-2xl font-bold transition-all ${
              tab === "elder"
                ? "bg-white text-teal-600 shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            👴 Elder
          </button>
          <button
            onClick={() => switchTab("caregiver")}
            className={`flex-1 py-4 rounded-xl text-2xl font-bold transition-all ${
              tab === "caregiver"
                ? "bg-white text-teal-600 shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            🩺 Caregiver
          </button>
        </div>

        {/* ── ELDER PANEL ── */}
        {tab === "elder" && (
          <div>
            {/* Login / Register toggle */}
            <div className="flex gap-3 mb-8">
              <button
                onClick={() => switchMode("login")}
                className={`flex-1 py-4 rounded-2xl text-2xl font-bold border-2 transition-all ${
                  elderMode === "login"
                    ? "border-teal-500 text-teal-600 bg-teal-50"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >Login</button>
              <button
                onClick={() => switchMode("register")}
                className={`flex-1 py-4 rounded-2xl text-2xl font-bold border-2 transition-all ${
                  elderMode === "register"
                    ? "border-teal-500 text-teal-600 bg-teal-50"
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >Register</button>
            </div>

            <form onSubmit={handleElder} className="space-y-5">
              {elderMode === "register" && (
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                  <input
                    type="text" value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Full Name" required
                    className="w-full pl-14 pr-5 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="Username" required
                  className="w-full pl-14 pr-5 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required
                  className="w-full pl-14 pr-14 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                </button>
              </div>

              {elderMode === "register" && (
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                  <input
                    type={showConf ? "text" : "password"} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirm Password" required
                    className="w-full pl-14 pr-14 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowConf(!showConf)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConf ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                  </button>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <p className="text-red-600 text-2xl font-semibold">⚠️ {error}</p>
                </div>
              )}

              <button type="submit"
                className="w-full py-6 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white rounded-2xl text-3xl font-bold transition-all shadow-lg mt-2">
                {elderMode === "login" ? "Login" : "Register as Elder"}
              </button>
            </form>
          </div>
        )}

        {/* ── CAREGIVER PANEL ── */}
        {tab === "caregiver" && (
          <div>
            <p className="text-gray-500 text-2xl mb-8 text-center">
              Login with the credentials set up by the Elder.
            </p>

            <form onSubmit={handleCaregiver} className="space-y-5">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                  placeholder="Username" required
                  className="w-full pl-14 pr-5 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-7 h-7 text-gray-400" />
                <input
                  type={showPass ? "text" : "password"} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password" required
                  className="w-full pl-14 pr-14 py-5 text-2xl border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-7 h-7" /> : <Eye className="w-7 h-7" />}
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                  <p className="text-red-600 text-2xl font-semibold">⚠️ {error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-6 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 active:scale-95 text-white rounded-2xl text-3xl font-bold transition-all shadow-lg mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : "Login as Caregiver"}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xl mt-8">
              Don't have an account? Ask the Elder to register you from the{" "}
              <span className="text-teal-500 font-semibold">Caregiver</span> section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}