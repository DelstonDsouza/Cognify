import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck, Bell, Pill, ClipboardList, Clock,
  AlertTriangle, Activity, Heart, TrendingUp, User,
  CheckCircle, XCircle, Calendar,
} from "lucide-react";
import { computeCaregiverOverview } from "../../../utils/localAnalysis";

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

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

interface Medication {
  // accepts both localStorage (time) and backend (scheduleTime)
  id: string;
  name: string;
  dosage: string;
  time?: string;
  scheduleTime?: string;
  frequency: string;
  taken: boolean;
}

function StatCard({
  label, value, sub, color, icon: Icon, big = false,
}: {
  label: string; value: string | number; sub?: string;
  color: string; icon: any; big?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-7 border-2 shadow-md ${color} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold opacity-75">{label}</p>
        <Icon className="w-7 h-7 opacity-60" />
      </div>
      <p className={`font-bold leading-none ${big ? "text-6xl" : "text-5xl"}`}>{value}</p>
      {sub && <p className="text-base opacity-65 mt-1">{sub}</p>}
    </div>
  );
}

export function CaregiverDashboard() {
  const [overview,    setOverview]    = useState<any>(null);
  const [medicines,   setMedicines]   = useState<Medication[]>([]);
  const [checkIns,    setCheckIns]    = useState<CheckIn[]>([]);
  const [vitals,      setVitals]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const session = JSON.parse(sessionStorage.getItem("caregiver_auth") || "{}");

  const load = useCallback(async () => {
    setLoading(true);

    const [medData, symData, vitalsData] = await Promise.all([
      apiGet("/api/medicines?userId=user_001"),
      apiGet("/api/symptoms?userId=user_001"),
      apiGet("/api/health-vitals?userId=user_001"),
    ]);

    const meds: Medication[] = (() => {
      // Prefer backend, fall back to localStorage
      if (medData?.medicines?.length) return medData.medicines;
      const stored = localStorage.getItem("medications");
      return stored ? JSON.parse(stored) : [];
    })();

    const symptoms  = symData?.symptoms  || [];
    const ci: CheckIn[] = JSON.parse(localStorage.getItem("seva_checkins") || "[]");

    setMedicines(meds);
    setCheckIns(ci);
    if (vitalsData?.vitals) setVitals(vitalsData.vitals);

    const result = computeCaregiverOverview(meds, ci, symptoms);
    setOverview(result);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Listen for sidebar refresh button
    window.addEventListener("caregiver-refresh", load);
    return () => window.removeEventListener("caregiver-refresh", load);
  }, [load]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-2xl text-slate-500 font-medium">Loading patient data…</p>
    </div>
  );

  if (!overview) return (
    <div className="text-center py-20">
      <p className="text-2xl text-slate-400">No data available yet.</p>
    </div>
  );

  const severityStyle = (s: string) =>
    s === "critical" ? "bg-red-50 text-red-700 border-red-300" :
    s === "high"     ? "bg-orange-50 text-orange-700 border-orange-300" :
                       "bg-yellow-50 text-yellow-700 border-yellow-300";

  // Compute counts
  const now = new Date();
  const takenToday    = medicines.filter(m => m.taken).length;
  const totalMeds     = medicines.length;
  const missedMeds    = medicines.filter(m => {
    if (m.taken) return false;
    const [h, min] = (m.time || m.scheduleTime || "00:00").split(":").map(Number);
    const t = new Date(); t.setHours(h, min, 0, 0);
    return now > t;
  });
  const upcomingMeds  = medicines.filter(m => {
    if (m.taken) return false;
    const [h, min] = (m.time || m.scheduleTime || "00:00").split(":").map(Number);
    const t = new Date(); t.setHours(h, min, 0, 0);
    return now <= t;
  });
  const recentCheckIns = [...checkIns].reverse().slice(0, 5);
  const lastCheckIn    = checkIns[checkIns.length - 1] || null;
  const todayCheckIns  = checkIns.filter(c =>
    new Date(c.timestamp).toDateString() === now.toDateString()
  );

  return (
    <div className="space-y-10 pb-16">

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-5xl font-bold text-slate-800 flex items-center gap-3">
            <ShieldCheck className="w-12 h-12 text-blue-500" />
            Patient Overview
          </h2>
          <p className="text-xl text-slate-500 mt-2">
            Logged in as <span className="font-semibold text-slate-700">{session.name}</span>
            &nbsp;·&nbsp;Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>

        {/* Patient badge */}
        <div className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-800">Patient (user_001)</p>
            <p className={`text-base font-semibold ${
              lastCheckIn?.status === "fine"   ? "text-green-600" :
              lastCheckIn?.status === "help"   ? "text-red-600"   :
              lastCheckIn?.status === "unwell" ? "text-orange-600": "text-slate-400"
            }`}>
              {lastCheckIn?.status === "fine"   ? "✅ Feeling Fine" :
               lastCheckIn?.status === "help"   ? "🚨 Needs Help"  :
               lastCheckIn?.status === "unwell" ? "⚠️ Not Well"    : "❓ No check-in yet"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Critical Alerts ── */}
      {overview.alerts?.filter((a: any) => a.severity === "critical").length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-6 flex items-start gap-4">
          <span className="text-4xl">🚨</span>
          <div className="flex-1">
            <p className="text-2xl font-bold text-red-700 mb-2">Critical Alerts!</p>
            {overview.alerts
              .filter((a: any) => a.severity === "critical")
              .map((a: any, i: number) => (
                <p key={i} className="text-xl text-red-600 font-medium">{a.message}</p>
              ))}
          </div>
        </div>
      )}

      {/* ── Top Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          label="Independence Score"
          value={overview.stabilityNumber ?? "—"}
          sub={overview.stabilityScore}
          icon={TrendingUp}
          color={
            overview.stabilityScore === "Stable"
              ? "bg-green-50 border-green-300 text-green-800"
              : overview.stabilityScore === "Slightly Irregular"
              ? "bg-orange-50 border-orange-300 text-orange-800"
              : "bg-red-50 border-red-300 text-red-800"
          }
        />
        <StatCard
          label="Active Alerts"
          value={overview.totalAlerts ?? overview.alerts?.length ?? 0}
          sub="Need attention"
          icon={Bell}
          color={
            (overview.totalAlerts ?? 0) === 0
              ? "bg-green-50 border-green-300 text-green-800"
              : "bg-red-50 border-red-300 text-red-800"
          }
        />
        <StatCard
          label="Meds Taken Today"
          value={`${takenToday}/${totalMeds}`}
          sub={missedMeds.length > 0 ? `${missedMeds.length} missed` : "All on track"}
          icon={Pill}
          color={
            missedMeds.length === 0
              ? "bg-purple-50 border-purple-300 text-purple-800"
              : "bg-orange-50 border-orange-300 text-orange-800"
          }
        />
        <StatCard
          label="Activity Status"
          value={overview.inactivity?.inactive ? "Inactive" : "Active"}
          sub={overview.inactivity?.hoursAgo ? `${overview.inactivity.hoursAgo}h ago` : "Normal"}
          icon={Activity}
          color={
            overview.inactivity?.inactive
              ? "bg-red-50 border-red-300 text-red-800"
              : "bg-teal-50 border-teal-300 text-teal-800"
          }
        />
      </div>

      {/* ── Two Column: Medications + Last Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Medications Status */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Pill className="w-7 h-7 text-purple-500" />
            Today's Medications
          </h3>
          {medicines.length === 0 ? (
            <p className="text-xl text-slate-400 text-center py-8">No medications added</p>
          ) : (
            <div className="space-y-3">
              {medicines.map((med, i) => {
                const [h, min] = (med.time || med.scheduleTime || "00:00").split(":").map(Number);
                const t = new Date(); t.setHours(h, min, 0, 0);
                const isOverdue = !med.taken && now > t;
                const isPending = !med.taken && now <= t;

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-4 rounded-xl border ${
                      med.taken   ? "bg-green-50 border-green-200"  :
                      isOverdue   ? "bg-red-50 border-red-200"      :
                                    "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div>
                      <p className="text-xl font-bold text-slate-800">{med.name}</p>
                      <p className="text-base text-slate-500">{med.dosage} · {med.time || med.scheduleTime}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {med.taken ? (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-lg">
                          <CheckCircle className="w-6 h-6" /> Taken
                        </span>
                      ) : isOverdue ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-lg">
                          <XCircle className="w-6 h-6" /> Missed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-blue-600 font-bold text-lg">
                          <Clock className="w-6 h-6" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Last Known Status + Today's Check-ins */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Heart className="w-7 h-7 text-rose-500" />
            Patient Status
          </h3>

          {/* Last check-in */}
          <div className={`p-5 rounded-xl mb-5 ${
            lastCheckIn?.status === "fine"   ? "bg-green-50 border border-green-200" :
            lastCheckIn?.status === "help"   ? "bg-red-50 border border-red-200"    :
            lastCheckIn?.status === "unwell" ? "bg-orange-50 border border-orange-200":
                                               "bg-slate-50 border border-slate-200"
          }`}>
            <p className="text-base font-semibold text-slate-500 mb-2">Last Check-in</p>
            <p className={`text-2xl font-bold ${
              lastCheckIn?.status === "fine"   ? "text-green-700" :
              lastCheckIn?.status === "help"   ? "text-red-700"   :
              lastCheckIn?.status === "unwell" ? "text-orange-700": "text-slate-500"
            }`}>
              {lastCheckIn?.status === "fine"   ? "✅ Feeling Fine" :
               lastCheckIn?.status === "help"   ? "🚨 Needs Help"  :
               lastCheckIn?.status === "unwell" ? "⚠️ Not Well"    : "❓ No check-in yet"}
            </p>
            {lastCheckIn && (
              <p className="text-base text-slate-500 mt-2">
                {new Date(lastCheckIn.timestamp).toLocaleString()}
              </p>
            )}
            {lastCheckIn?.transcriptText && (
              <p className="text-base text-slate-600 italic mt-1">
                "{lastCheckIn.transcriptText}"
              </p>
            )}
          </div>

          {/* Today's check-in count */}
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <ClipboardList className="w-7 h-7 text-slate-400" />
            <div>
              <p className="text-xl font-bold text-slate-700">
                {todayCheckIns.length} check-in{todayCheckIns.length !== 1 ? "s" : ""} today
              </p>
              <p className="text-base text-slate-400">
                {checkIns.length} total recorded
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── All Alerts ── */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Bell className="w-7 h-7 text-red-500" />
          Active Alerts ({overview.alerts?.length ?? 0})
        </h3>
        {!overview.alerts?.length ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-3" />
            <p className="text-2xl font-semibold text-green-600">No active alerts — all good!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {overview.alerts.map((a: any, i: number) => (
              <div key={i} className={`flex items-start gap-4 p-5 rounded-xl border ${severityStyle(a.severity)}`}>
                <span className="text-3xl">
                  {a.severity === "critical" ? "🚨" : a.severity === "high" ? "⚠️" : "📋"}
                </span>
                <div>
                  <p className="text-xl font-semibold">{a.message}</p>
                  <p className="text-base opacity-70 capitalize mt-1">Severity: {a.severity}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Routine Deviations ── */}
      {overview.routineDeviations?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-orange-500" />
            Routine Deviations ({overview.routineDeviations.length})
          </h3>
          <div className="space-y-3">
            {overview.routineDeviations.map((d: any, i: number) => (
              <div key={i} className={`p-5 rounded-xl border ${severityStyle(d.severity)}`}>
                <p className="text-xl font-medium">{d.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Check-ins Timeline ── */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
        <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <ClipboardList className="w-7 h-7 text-blue-500" />
          Recent Check-ins
        </h3>
        {recentCheckIns.length === 0 ? (
          <p className="text-xl text-slate-400 text-center py-8">No check-ins recorded yet</p>
        ) : (
          <div className="space-y-3">
            {recentCheckIns.map((c, i) => (
              <div
                key={i}
                className={`flex items-center gap-5 p-5 rounded-xl border ${
                  c.status === "fine"   ? "bg-green-50 border-green-200"   :
                  c.status === "help"   ? "bg-red-50 border-red-200"       :
                                          "bg-orange-50 border-orange-200"
                }`}
              >
                <span className="text-3xl">
                  {c.status === "fine" ? "😊" : c.status === "help" ? "🚨" : "😟"}
                </span>
                <div className="flex-1">
                  <p className={`text-xl font-bold ${
                    c.status === "fine"   ? "text-green-700" :
                    c.status === "help"   ? "text-red-700"   : "text-orange-700"
                  }`}>
                    {c.status === "fine" ? "Feeling Fine" :
                     c.status === "help" ? "Needed Help"  : "Not Feeling Well"}
                  </p>
                  {c.transcriptText && (
                    <p className="text-base text-slate-600 italic mt-1">"{c.transcriptText}"</p>
                  )}
                </div>
                <p className="text-base text-slate-400 text-right shrink-0">
                  {new Date(c.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Symptoms ── */}
      {overview.recentSymptoms?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
            Recent Symptoms
          </h3>
          <div className="space-y-3">
            {overview.recentSymptoms.map((s: any, i: number) => (
              <div
                key={i}
                className={`p-5 rounded-xl border-l-4 ${
                  s.critical ? "bg-red-50 border-red-500" : "bg-slate-50 border-slate-300"
                }`}
              >
                <p className="text-xl text-slate-800">{s.transcriptText}</p>
                <p className="text-base text-slate-400 mt-2">
                  {new Date(s.timestamp).toLocaleString()}
                  {s.critical && (
                    <span className="ml-3 text-red-600 font-bold">🚨 Critical</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}