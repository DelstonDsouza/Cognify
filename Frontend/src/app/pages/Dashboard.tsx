import { Link } from "react-router";
import {
  Heart,
  Activity,
  Pill,
  Calendar,
  Phone,
  AlertCircle,
  Sun,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import {
  computeCaregiverOverview,
  computeStabilityScore,
} from "../../utils/localAnalysis";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HealthData {
  date: string;
  bloodPressure: number;
  heartRate: number;
}

interface CheckIn {
  status: "fine" | "unwell" | "help";
  timestamp: string;
  transcriptText?: string;
}

interface Overview {
  stabilityScore: string;
  stabilityNumber: number;
  stabilityColor: string;
  statusSummary: { status: string; at: string | null };
  missedMedicines: { id: string; name: string; scheduleTime: string }[];
  alerts: { type: string; message: string; severity: string }[];
  routineDeviations: { type: string; message: string; severity: string }[];
  inactivity: { inactive: boolean; hoursAgo: number | null; message: string };
  totalAlerts: number;
}

// ── API helper ────────────────────────────────────────────────────────────────

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

async function apiPost(path: string, body: object) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API}${path}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadCheckIns(): CheckIn[] {
  return JSON.parse(localStorage.getItem("seva_checkins") || "[]");
}

function saveCheckIn(checkIn: CheckIn) {
  const existing = loadCheckIns();
  existing.push(checkIn);
  localStorage.setItem("seva_checkins", JSON.stringify(existing));
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const [healthData, setHealthData]     = useState<HealthData[]>([]);
  const [upcomingMeds, setUpcomingMeds] = useState<any[]>([]);
  const [medicines, setMedicines]       = useState<any[]>([]);
  const [checkIns, setCheckIns]         = useState<CheckIn[]>([]);
  const [symptoms, setSymptoms]         = useState<any[]>([]);
  const [overview, setOverview]         = useState<Overview | null>(null);
  const [checkingIn, setCheckingIn]     = useState(false);
  const [lastCheckIn, setLastCheckIn]   = useState<CheckIn | null>(null);

  // Medications taken/total for summary
  const takenCount    = upcomingMeds.filter((m: any) => m.taken).length;
  const totalMedCount = upcomingMeds.length;

  // ── Load on mount ────────────────────────────────────────────────────────
  useEffect(() => {
    // Mock health chart data
    setHealthData([
      { date: "Mon", bloodPressure: 120, heartRate: 72 },
      { date: "Tue", bloodPressure: 118, heartRate: 70 },
      { date: "Wed", bloodPressure: 122, heartRate: 74 },
      { date: "Thu", bloodPressure: 119, heartRate: 71 },
      { date: "Fri", bloodPressure: 121, heartRate: 73 },
      { date: "Sat", bloodPressure: 117, heartRate: 69 },
      { date: "Sun", bloodPressure: 120, heartRate: 72 },
    ]);

    // Load upcoming meds from localStorage
    const stored = localStorage.getItem("medications");
    if (stored) {
      const meds = JSON.parse(stored);
      const now  = new Date();
      const upcoming = meds
        .filter((med: any) => {
          const [hours, minutes] = med.time.split(":");
          const medTime = new Date();
          medTime.setHours(parseInt(hours), parseInt(minutes), 0);
          return medTime > now;
        })
        .slice(0, 3);
      setUpcomingMeds(upcoming);
      setMedicines(meds);
    }

    // Load check-ins from localStorage
    const ci = loadCheckIns();
    setCheckIns(ci);
    if (ci.length > 0) {
      setLastCheckIn(ci[ci.length - 1]);
    }

    // Fetch symptoms from backend
    apiGet("/api/symptoms?userId=user_001").then((data) => {
      if (data?.symptoms) setSymptoms(data.symptoms);
    });
  }, []);

  // ── Recompute overview when data changes ──────────────────────────────────
  useEffect(() => {
    const result = computeCaregiverOverview(medicines, checkIns, symptoms);
    setOverview(result as Overview);
  }, [medicines, checkIns, symptoms]);

  // ── Morning Check-In (text fallback — no voice needed) ───────────────────
  const handleCheckIn = async (feeling: "fine" | "unwell" | "help") => {
    setCheckingIn(true);

    const transcriptMap = {
      fine:   "I am feeling fine today",
      unwell: "I am not feeling well today",
      help:   "I need help please",
    };

    const result = await apiPost("/api/morning-checkin", {
      userId:         "user_001",
      transcriptText: transcriptMap[feeling],
    });

    const newCheckIn: CheckIn = {
      status:         result?.status || feeling,
      timestamp:      new Date().toISOString(),
      transcriptText: transcriptMap[feeling],
    };

    saveCheckIn(newCheckIn);
    const updated = loadCheckIns();
    setCheckIns(updated);
    setLastCheckIn(newCheckIn);
    setCheckingIn(false);
  };

  // ── Quick Actions ─────────────────────────────────────────────────────────
  const quickActions = [
    { title: "Emergency SOS",      icon: Phone,     link: "/emergency",    color: "bg-red-500 hover:bg-red-600",       textColor: "text-white" },
    { title: "Log Health Data",    icon: Activity,  link: "/health",       color: "bg-green-500 hover:bg-green-600",   textColor: "text-white" },
    { title: "Take Medication",    icon: Pill,       link: "/medications",  color: "bg-purple-500 hover:bg-purple-600", textColor: "text-white" },
    { title: "View Appointments",  icon: Calendar,  link: "/appointments", color: "bg-blue-500 hover:bg-blue-600",     textColor: "text-white" },
  ];

  // ── Stability color helper ────────────────────────────────────────────────
  const stabilityBg = overview?.stabilityScore === "Stable"
    ? "bg-green-100 text-green-800 border-green-300"
    : overview?.stabilityScore === "Slightly Irregular"
    ? "bg-orange-100 text-orange-800 border-orange-300"
    : "bg-red-100 text-red-800 border-red-300";

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          Welcome Back!
        </h2>
        <p className="text-xl text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* ── MORNING CHECK-IN CARD ── */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
        <h3 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          <Sun className="w-7 h-7 text-yellow-400" />
          Morning Check-In
        </h3>

        {lastCheckIn ? (
          <div className="mt-3">
            <p className="text-lg text-gray-600 mb-1">
              Last check-in:{" "}
              <span className="font-semibold">
                {new Date(lastCheckIn.timestamp).toLocaleString()}
              </span>
            </p>
            <span className={`inline-block px-4 py-1 rounded-full text-lg font-bold ${
              lastCheckIn.status === "fine"   ? "bg-green-100 text-green-700" :
              lastCheckIn.status === "help"   ? "bg-red-100 text-red-700"    :
                                                "bg-orange-100 text-orange-700"
            }`}>
              {lastCheckIn.status === "fine"   ? "✅ Feeling Fine" :
               lastCheckIn.status === "help"   ? "🚨 Needs Help"  :
                                                 "⚠️ Not Well"}
            </span>
            <p className="text-base text-gray-500 mt-3 mb-2">Update your status:</p>
          </div>
        ) : (
          <p className="text-lg text-gray-500 mt-2 mb-3">
            How are you feeling today?
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-2">
          <button
            onClick={() => handleCheckIn("fine")}
            disabled={checkingIn}
            className="px-5 py-2 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            😊 I'm Fine
          </button>
          <button
            onClick={() => handleCheckIn("unwell")}
            disabled={checkingIn}
            className="px-5 py-2 bg-orange-500 text-white rounded-lg text-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            😟 Not Well
          </button>
          <button
            onClick={() => handleCheckIn("help")}
            disabled={checkingIn}
            className="px-5 py-2 bg-red-500 text-white rounded-lg text-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            🆘 Need Help
          </button>
        </div>
      </div>

      {/* ── STABILITY SCORE + ALERTS ROW ── */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Stability Score */}
          <div className={`rounded-xl shadow-lg p-5 border-2 ${stabilityBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-xl font-bold">Independence Score</h3>
            </div>
            <p className="text-5xl font-bold mt-2">{overview.stabilityNumber}</p>
            <p className="text-2xl font-semibold mt-1">{overview.stabilityScore}</p>
          </div>

          {/* Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-800">
                Active Alerts ({overview.totalAlerts})
              </h3>
            </div>
            {overview.alerts.length === 0 ? (
              <p className="text-lg text-green-600 font-semibold">✅ No alerts — all good!</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {overview.alerts.map((a, i) => (
                  <div key={i} className={`text-base px-3 py-2 rounded-lg font-medium ${
                    a.severity === "critical" ? "bg-red-100 text-red-700"    :
                    a.severity === "high"     ? "bg-orange-100 text-orange-700" :
                                               "bg-yellow-100 text-yellow-700"
                  }`}>
                    {a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "📋"} {a.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROUTINE DEVIATIONS ── */}
      {overview && overview.routineDeviations.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-5">
          <h3 className="text-xl font-bold text-orange-800 mb-3">
            ⚠️ Routine Deviations Detected
          </h3>
          <div className="space-y-2">
            {overview.routineDeviations.map((d, i) => (
              <p key={i} className="text-base text-orange-700 font-medium">
                • {d.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions — your original, unchanged */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.link}
              className={`${action.color} ${action.textColor} p-6 rounded-xl shadow-lg transition-transform hover:scale-105`}
            >
              <Icon className="w-10 h-10 mb-3" />
              <h3 className="text-xl font-semibold">{action.title}</h3>
            </Link>
          );
        })}
      </div>

      {/* Health Overview — your original, unchanged */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Health Trends Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500" />
            Weekly Health Trends
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" style={{ fontSize: "14px" }} />
              <YAxis style={{ fontSize: "14px" }} />
              <Tooltip contentStyle={{ fontSize: "16px", padding: "10px" }} />
              <Line type="monotone" dataKey="bloodPressure" stroke="#3b82f6" strokeWidth={3} name="Blood Pressure" />
              <Line type="monotone" dataKey="heartRate"     stroke="#ef4444" strokeWidth={3} name="Heart Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Medications */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Pill className="w-7 h-7 text-purple-500" />
            Upcoming Medications
          </h3>
          {upcomingMeds.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeds.map((med, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{med.name}</p>
                    <p className="text-gray-600">{med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">{med.time}</p>
                  </div>
                </div>
              ))}
              <Link to="/medications" className="block text-center text-blue-600 hover:text-blue-700 font-semibold text-lg mt-4">
                View All Medications →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-lg text-gray-500 mb-4">No medications scheduled</p>
              <Link to="/medications" className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors">
                Add Medications
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's Summary — your original + real medicine count */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Medications Taken</p>
            <p className="text-4xl font-bold">{takenCount}/{totalMedCount}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Missed Medicines</p>
            <p className="text-4xl font-bold">{overview?.missedMedicines.length ?? 0}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Inactivity Status</p>
            <p className="text-2xl font-bold">
              {overview?.inactivity.inactive ? "⚠️ Inactive" : "✅ Active"}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}