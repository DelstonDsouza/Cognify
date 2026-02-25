import { useEffect, useState, useCallback } from "react";
import { Activity, Heart, TrendingUp } from "lucide-react";

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface Vital {
  type: string;
  value: number | string;
  unit?: string;
  timestamp: string;
  notes?: string;
}

const VITAL_CONFIG: Record<string, { label: string; icon: string; color: string; unit: string }> = {
  blood_pressure: { label: "Blood Pressure", icon: "🩺", color: "bg-red-50 border-red-300 text-red-800",    unit: "mmHg" },
  heart_rate:     { label: "Heart Rate",     icon: "❤️", color: "bg-rose-50 border-rose-300 text-rose-800",  unit: "bpm"  },
  blood_sugar:    { label: "Blood Sugar",    icon: "🩸", color: "bg-amber-50 border-amber-300 text-amber-800",unit: "mg/dL"},
  weight:         { label: "Weight",         icon: "⚖️", color: "bg-blue-50 border-blue-300 text-blue-800",  unit: "kg"   },
  temperature:    { label: "Temperature",    icon: "🌡️", color: "bg-orange-50 border-orange-300 text-orange-800", unit: "°C" },
  oxygen:         { label: "Oxygen Level",   icon: "💨", color: "bg-teal-50 border-teal-300 text-teal-800",  unit: "%"   },
};

export function CaregiverVitals() {
  const [vitals,  setVitals]  = useState<Vital[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/health-vitals?userId=user_001`);
      const data = await res.json();
      if (data?.vitals) {
        setVitals([...data.vitals].reverse());
      } else {
        // fall back to localStorage
        const stored = localStorage.getItem("health_vitals");
        setVitals(stored ? [...JSON.parse(stored)].reverse() : []);
      }
    } catch {
      const stored = localStorage.getItem("health_vitals");
      setVitals(stored ? [...JSON.parse(stored)].reverse() : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("caregiver-refresh", load);
    return () => window.removeEventListener("caregiver-refresh", load);
  }, [load]);

  // Get latest reading per type
  const latestByType: Record<string, Vital> = {};
  vitals.forEach(v => {
    if (!latestByType[v.type]) latestByType[v.type] = v;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-5xl font-bold text-slate-800 flex items-center gap-3 mb-2">
          <Activity className="w-12 h-12 text-teal-500" />
          Health Vitals
        </h2>
        <p className="text-xl text-slate-500">Latest readings from the patient</p>
      </div>

      {/* Latest vitals cards */}
      {Object.keys(latestByType).length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-md border border-slate-100">
          <Activity className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <p className="text-2xl text-slate-400">No vitals recorded yet</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {Object.entries(latestByType).map(([type, vital]) => {
              const cfg = VITAL_CONFIG[type] || {
                label: type, icon: "📊", color: "bg-slate-50 border-slate-300 text-slate-800", unit: ""
              };
              return (
                <div key={type} className={`rounded-2xl border-2 p-7 shadow-md ${cfg.color}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl">{cfg.icon}</span>
                    <p className="text-lg font-semibold opacity-80">{cfg.label}</p>
                  </div>
                  <p className="text-5xl font-bold">
                    {vital.value} <span className="text-2xl opacity-60">{vital.unit || cfg.unit}</span>
                  </p>
                  <p className="text-base opacity-60 mt-2">
                    {new Date(vital.timestamp).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Full history */}
          <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-7">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-teal-500" />
              Full History ({vitals.length} readings)
            </h3>
            <div className="space-y-3">
              {vitals.map((v, i) => {
                const cfg = VITAL_CONFIG[v.type] || { label: v.type, icon: "📊", unit: "" };
                return (
                  <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cfg.icon}</span>
                      <div>
                        <p className="text-xl font-bold text-slate-800">{cfg.label}</p>
                        {v.notes && <p className="text-base text-slate-500 italic">{v.notes}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-700">
                        {v.value} <span className="text-lg text-slate-400">{v.unit || cfg.unit}</span>
                      </p>
                      <p className="text-base text-slate-400">
                        {new Date(v.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
