import { useState } from "react";
import { useNavigate } from "react-router";
import { ShieldCheck, Eye, EyeOff, Lock, User } from "lucide-react";

// ── Hardcoded caregiver credentials (swap for real auth later) ────────────────
const CAREGIVER_CREDENTIALS = [
  { username: "caregiver",  password: "seva2024",  name: "Primary Caregiver" },
  { username: "doctor",     password: "doctor123", name: "Dr. Sharma"         },
  { username: "family",     password: "family123", name: "Family Member"      },
];

export function CaregiverLogin() {
  const navigate = useNavigate();
  const [username,    setUsername]    = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [shake,       setShake]       = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    await new Promise(r => setTimeout(r, 600)); // slight delay feels more real

    const match = CAREGIVER_CREDENTIALS.find(
      c => c.username === username.trim().toLowerCase() && c.password === password
    );

    if (match) {
      sessionStorage.setItem("caregiver_auth", JSON.stringify({
        name: match.name,
        username: match.username,
        loginAt: new Date().toISOString(),
      }));
      navigate("/caregiver/dashboard");
    } else {
      setError("Invalid username or password. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className={`relative w-full max-w-md transition-all duration-150 ${shake ? "translate-x-2" : ""}`}>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl">

          {/* Logo / Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500/20 border-2 border-blue-400/40 rounded-2xl mb-5">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Seva Saati</h1>
            <p className="text-blue-300 text-xl font-medium">Caregiver Portal</p>
            <p className="text-white/40 text-base mt-2">Secure access for care providers</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Username */}
            <div>
              <label className="block text-white/70 text-lg font-semibold mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-12 pr-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-xl placeholder-white/30 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-lg font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/30" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-12 pr-14 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-xl placeholder-white/30 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-5 py-3">
                <p className="text-red-300 text-lg font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white rounded-xl text-2xl font-bold transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-400/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying...
                </span>
              ) : "Login to Dashboard"}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-white/40 text-base text-center mb-2 font-medium">Demo credentials</p>
            <p className="text-white/60 text-base text-center">
              Username: <span className="text-blue-300 font-mono">caregiver</span>
              &nbsp;·&nbsp;
              Password: <span className="text-blue-300 font-mono">seva2024</span>
            </p>
          </div>

          {/* Back to patient app */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-white/40 hover:text-white/70 text-lg transition-colors"
            >
              ← Back to Patient App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
