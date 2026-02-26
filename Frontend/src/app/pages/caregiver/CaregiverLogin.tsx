import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, Eye, EyeOff, Lock, User } from "lucide-react";
import { login, isLoggedIn } from "../../../utils/caregiverAuth";

export function CaregiverLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [shake,    setShake]    = useState(false);

  // ── Already logged in → skip straight to dashboard ────────────────────────
  useEffect(() => {
    if (isLoggedIn()) navigate("/caregiver-portal/dashboard", { replace: true });
  }, [navigate]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    await new Promise(r => setTimeout(r, 500));

    const result = login(username, password);
    if (result.success) {
      navigate("/caregiver-portal/dashboard", { replace: true });
    } else {
      setError(result.error || "Login failed.");
      triggerShake();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-teal-900 flex items-center justify-center p-6">

      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-md transition-transform duration-150 ${shake ? "translate-x-3" : ""}`}>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-500/20 border-2 border-teal-400/40 rounded-3xl mb-6">
              <ShieldCheck className="w-12 h-12 text-teal-400" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-2">Seva Saati</h1>
            <p className="text-teal-300 text-2xl font-semibold">Caregiver Portal</p>
            <p className="text-white/40 text-lg mt-2">Sign in to monitor your loved one</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">

            <div>
              <label className="block text-white/70 text-xl font-semibold mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                  className="w-full pl-12 pr-5 py-5 bg-white/10 border border-white/20 rounded-xl text-white text-xl placeholder-white/30 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/70 text-xl font-semibold mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-12 pr-14 py-5 bg-white/10 border border-white/20 rounded-xl text-white text-xl placeholder-white/30 focus:outline-none focus:border-teal-400 focus:bg-white/15 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                  {showPass ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-5 py-4">
                <p className="text-red-300 text-xl font-medium">⚠️ {error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-teal-500 hover:bg-teal-400 disabled:bg-teal-500/40 text-white rounded-xl text-2xl font-bold transition-all shadow-lg shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          {/* Info — no register link here */}
          <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-xl text-center">
            <p className="text-white/50 text-lg">
              Don't have an account? Ask the patient to register you from their{" "}
              <span className="text-teal-300 font-semibold">Caregiver</span>{" "}
              page in the app.
            </p>
          </div>

          <div className="mt-5 text-center">
            <a href="/" className="text-white/30 hover:text-white/60 text-lg transition-colors">
              ← Back to Patient App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}