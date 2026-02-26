import { useState, useEffect } from "react";
import { ShieldCheck, User, Lock, Eye, EyeOff, Heart, CheckCircle, UserPlus } from "lucide-react";

const RELATIONSHIPS = [
  "Son", "Daughter", "Spouse", "Parent",
  "Sibling", "Doctor", "Nurse", "Family Friend", "Other",
];

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function RegisterCaregiver() {
  const [fullName,       setFullName]       = useState("");
  const [username,       setUsername]       = useState("");
  const [relationship,   setRelationship]   = useState("Son");
  const [password,       setPassword]       = useState("");
  const [confirm,        setConfirm]        = useState("");
  const [showPass,       setShowPass]       = useState(false);
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");
  const [done,           setDone]           = useState(false);
  const [registeredName, setRegisteredName] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"taken"|"available">("idle");

  const passwordMismatch = confirm.length > 0 && confirm !== password;
  const usernameUnavailable = usernameStatus === "taken";

  // ── Check username availability against MongoDB via backend ──
  useEffect(() => {
    if (username.trim().length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res  = await fetch(`${API_URL}/api/caregiver/list`);
        const data = await res.json();
        const taken = (data.caregivers || []).some(
          (c: any) => c.username === username.trim().toLowerCase()
        );
        setUsernameStatus(taken ? "taken" : "available");
      } catch {
        setUsernameStatus("available"); // if backend unreachable, allow submission
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  // ── Submit → POST /api/caregiver/register → saves to MongoDB ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm)  { setError("Passwords do not match."); return; }
    if (password.length < 6)   { setError("Password must be at least 6 characters."); return; }
    if (usernameUnavailable)   { setError("Username already taken."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/caregiver/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ fullName, username, password, relationship }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
      } else {
        setRegisteredName(fullName.trim());
        setDone(true);
        setFullName(""); setUsername(""); setPassword(""); setConfirm("");
        setRelationship("Son"); setUsernameStatus("idle");
      }
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-10 pb-12">

      {/* ── Page Header ── */}
      <div>
        <h2 className="text-5xl font-bold text-gray-800 flex items-center gap-3 mb-3">
          <ShieldCheck className="w-12 h-12 text-teal-500" />
          Register Caregiver
        </h2>
        <p className="text-2xl text-gray-500">
          Add a family member or doctor who will monitor your health remotely.
        </p>
      </div>

      {/* ── Success Banner ── */}
      {done && (
        <div className="bg-green-50 border-2 border-green-400 rounded-2xl p-8 flex items-center gap-5">
          <CheckCircle className="w-14 h-14 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-3xl font-bold text-green-700">
              ✅ {registeredName} has been registered!
            </p>
            <p className="text-xl text-green-600 mt-2">
              They can now log in at{" "}
              <a href="/caregiver-login" target="_blank" rel="noopener noreferrer"
                className="font-bold underline decoration-2">
                /caregiver-login
              </a>{" "}
              using their username and password.
            </p>
          </div>
        </div>
      )}

      {/* ── Registration Form ── */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-xl">
        <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <UserPlus className="w-8 h-8 text-teal-500" />
          Create Account
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Full Name */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">Full Name *</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input type="text" value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Ram Sharma" required
                className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">Relationship to You *</label>
            <div className="relative">
              <Heart className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <select value={relationship} onChange={e => setRelationship(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-xl border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors bg-white appearance-none">
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">Username *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">@</span>
              <input type="text" value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                placeholder="e.g. ram_sharma" required
                className={`w-full pl-10 pr-4 py-4 text-xl border-2 rounded-xl focus:outline-none transition-colors ${
                  usernameUnavailable
                    ? "border-red-400 bg-red-50"
                    : usernameStatus === "available"
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 focus:border-teal-500"
                }`}
              />
            </div>
            {usernameStatus === "checking"  && <p className="text-gray-400 text-lg mt-1">Checking...</p>}
            {usernameStatus === "taken"     && <p className="text-red-500 text-lg mt-1 font-medium">⚠️ Username already taken.</p>}
            {usernameStatus === "available" && <p className="text-green-600 text-lg mt-1 font-medium">✅ Username is available.</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">
              Password * <span className="text-gray-400 font-normal text-lg">(min. 6 characters)</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" required
                className="w-full pl-12 pr-14 py-4 text-xl border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xl font-bold text-gray-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input type={showConfirm ? "text" : "password"} value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Re-enter password" required
                className={`w-full pl-12 pr-14 py-4 text-xl border-2 rounded-xl focus:outline-none transition-colors ${
                  passwordMismatch
                    ? "border-red-400 bg-red-50"
                    : confirm && !passwordMismatch
                    ? "border-green-400 bg-green-50"
                    : "border-gray-200 focus:border-teal-500"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
            {passwordMismatch && <p className="text-red-500 text-lg mt-1 font-medium">⚠️ Passwords do not match.</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
              <p className="text-red-600 text-xl font-semibold">⚠️ {error}</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit"
            disabled={loading || usernameUnavailable || passwordMismatch}
            className="w-full py-6 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl text-2xl font-bold transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Registering...
              </span>
            ) : "✅ Register Caregiver"}
          </button>
        </form>
      </div>
    </div>
  );
}