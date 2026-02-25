import { useEffect, useState } from "react";
import { ShieldCheck, Bell, Pill, ClipboardList, Clock, AlertTriangle } from "lucide-react";
import { computeCaregiverOverview } from "../../utils/localAnalysis";

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

async function apiGet(path: string) {
  try {
    const res = await fetch(`${API}${path}`);
    return await res.json();
  } catch { return null; }
}

interface CheckIn {
  status: "fine" | "unwell" | "help";
  timestamp: string;
  transcriptText?: string;
}

export function CaregiverDashboard() {
  const [overview, setOverview]   = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = async () => {
    setLoading(true);

    // Get medicines from backend
    const medData  = await apiGet("/api/medicines?userId=user_001");
    const symData  = await apiGet("/api/symptoms?userId=user_001");

    const medicines = medData?.medicines || [];
    const symptoms  = symData?.symptoms  || [];

    // Get check-ins from localStorage
    const checkIns: CheckIn[] = JSON.parse(
      localStorage.getItem("seva_checkins") || "[]"
    );

    const result = computeCaregiverOverview(medicines, checkIns, symptoms);
    setOverview(result);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <p className="text-xl text-gray-500">Loading caregiver data...</p>
    </div>
  );

  const severityStyle = (s: string) =>
    s === "critical" ? "bg-red-100 text-red-700 border-red-300" :
    s === "high"     ? "bg-orange-100 text-orange-700 border-orange-300" :
                       "bg-yellow-100 text-yellow-700 border-yellow-300";

  const severityIcon = (s: string) =>
    s === "critical" ? "🚨" : s === "high" ? "⚠️" : "📋";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-blue-500" />
          Caregiver Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-400">
            Updated: {lastRefresh.toLocaleTimeString()}
          </p>
          <button
            onClick={load}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`rounded-xl p-5 border-2 text-center shadow ${
          overview.stabilityScore === "Stable"             ? "bg-green-100 border-green-300 text-green-800" :
          overview.stabilityScore === "Slightly Irregular" ? "bg-orange-100 border-orange-300 text-orange-800" :
                                                             "bg-red-100 border-red-300 text-red-800"
        }`}>
          <p className="text-4xl font-bold">{overview.stabilityNumber}</p>
          <p className="text-lg font-semibold mt-1">{overview.stabilityScore}</p>
          <p className="text-sm opacity-75">Independence Score</p>
        </div>

        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 text-center shadow">
          <p className="text-4xl font-bold text-red-500">{overview.totalAlerts}</p>
          <p className="text-lg font-semibold text-gray-700 mt-1">Active Alerts</p>
          <p className="text-sm text-gray-400">Need attention</p>
        </div>

        <div className="bg-white rounded-xl p-5 border-2 border-gray-100 text-center shadow">
          <p className="text-4xl font-bold text-orange-500">{overview.missedMedicines.length}</p>
          <p className="text-lg font-semibold text-gray-700 mt-1">Missed Meds</p>
          <p className="text-sm text-gray-400">Today</p>
        </div>

        <div className={`rounded-xl p-5 border-2 text-center shadow ${
          overview.inactivity.inactive
            ? "bg-red-100 border-red-300 text-red-800"
            : "bg-green-100 border-green-300 text-green-800"
        }`}>
          <p className="text-4xl">{overview.inactivity.inactive ? "⚠️" : "✅"}</p>
          <p className="text-lg font-semibold mt-1">
            {overview.inactivity.inactive ? "Inactive" : "Active"}
          </p>
          <p className="text-sm opacity-75">
            {overview.inactivity.hoursAgo != null
              ? `${overview.inactivity.hoursAgo}h ago`
              : "No data"}
          </p>
        </div>
      </div>

      {/* Last Known Status */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-400">
        <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-500" />
          Last Known Status
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <span className={`inline-block px-5 py-2 rounded-full text-xl font-bold ${
            overview.statusSummary.status === "fine"    ? "bg-green-100 text-green-700" :
            overview.statusSummary.status === "help"    ? "bg-red-100 text-red-700"    :
            overview.statusSummary.status === "unwell"  ? "bg-orange-100 text-orange-700" :
                                                          "bg-gray-100 text-gray-600"
          }`}>
            {overview.statusSummary.status === "fine"   ? "✅ Feeling Fine" :
             overview.statusSummary.status === "help"   ? "🚨 Needs Help"  :
             overview.statusSummary.status === "unwell" ? "⚠️ Not Well"    :
                                                          "❓ Unknown"}
          </span>
          <div>
            {overview.statusSummary.at ? (
              <p className="text-gray-600 text-lg">
                Reported at:{" "}
                <span className="font-semibold">
                  {new Date(overview.statusSummary.at).toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="text-gray-400 text-lg">No check-in recorded yet</p>
            )}
            {overview.statusSummary.transcript && (
              <p className="text-gray-500 text-base mt-1 italic">
                "{overview.statusSummary.transcript}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-red-500" />
          Active Alerts ({overview.alerts.length})
        </h3>
        {overview.alerts.length === 0 ? (
          <p className="text-lg text-green-600 font-semibold py-4 text-center">
            ✅ No active alerts — everything looks good!
          </p>
        ) : (
          <div className="space-y-3">
            {overview.alerts.map((a: any, i: number) => (
              <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${severityStyle(a.severity)}`}>
                <span className="text-2xl">{severityIcon(a.severity)}</span>
                <div>
                  <p className="font-semibold text-lg">{a.message}</p>
                  <p className="text-sm opacity-75 capitalize">Severity: {a.severity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missed Medicines Today */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Pill className="w-6 h-6 text-purple-500" />
          Missed Medicines Today ({overview.missedMedicines.length})
        </h3>
        {overview.missedMedicines.length === 0 ? (
          <p className="text-lg text-green-600 font-semibold py-4 text-center">
            ✅ All medicines accounted for today!
          </p>
        ) : (
          <div className="space-y-3">
            {overview.missedMedicines.map((m: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-lg font-semibold text-gray-800">{m.name}</p>
                <p className="text-purple-600 font-bold text-lg">⏰ {m.scheduleTime}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Deviations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-orange-500" />
          Routine Deviations ({overview.routineDeviations.length})
        </h3>
        {overview.routineDeviations.length === 0 ? (
          <p className="text-lg text-green-600 font-semibold py-4 text-center">
            ✅ Routine is normal. No deviations detected.
          </p>
        ) : (
          <div className="space-y-3">
            {overview.routineDeviations.map((d: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border ${severityStyle(d.severity)}`}>
                <p className="text-lg font-medium">{d.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Symptoms */}
      {overview.recentSymptoms.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Recent Symptoms
          </h3>
          <div className="space-y-3">
            {overview.recentSymptoms.map((s: any, i: number) => (
              <div key={i} className={`p-4 rounded-lg border-l-4 ${
                s.critical ? "bg-red-50 border-red-500" : "bg-gray-50 border-gray-300"
              }`}>
                <p className="text-lg text-gray-800">{s.transcriptText}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(s.timestamp).toLocaleString()}
                  {s.critical && <span className="ml-2 text-red-600 font-bold">🚨 Critical</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}