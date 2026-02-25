import { useEffect, useState, useCallback } from "react";
import { Pill, CheckCircle, XCircle, Clock } from "lucide-react";

const API = (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time?: string;
  scheduleTime?: string;
  frequency: string;
  taken: boolean;
}

export function CaregiverMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/medicines?userId=user_001`);
      const data = await res.json();
      if (data?.medicines?.length) {
        setMedications(data.medicines);
      } else {
        const stored = localStorage.getItem("medications");
        setMedications(stored ? JSON.parse(stored) : []);
      }
    } catch {
      const stored = localStorage.getItem("medications");
      setMedications(stored ? JSON.parse(stored) : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("caregiver-refresh", load);
    return () => window.removeEventListener("caregiver-refresh", load);
  }, [load]);

  const now = new Date();
  const taken   = medications.filter(m => m.taken);
  const missed  = medications.filter(m => {
    if (m.taken) return false;
    const [h, min] = (m.time || m.scheduleTime || "00:00").split(":").map(Number);
    const t = new Date(); t.setHours(h, min, 0, 0);
    return now > t;
  });
  const pending = medications.filter(m => {
    if (m.taken) return false;
    const [h, min] = (m.time || m.scheduleTime || "00:00").split(":").map(Number);
    const t = new Date(); t.setHours(h, min, 0, 0);
    return now <= t;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-5xl font-bold text-slate-800 flex items-center gap-3 mb-2">
          <Pill className="w-12 h-12 text-purple-500" />
          Patient Medications
        </h2>
        <p className="text-xl text-slate-500">Read-only view of all medications</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-green-700">{taken.length}</p>
          <p className="text-xl font-semibold text-green-600 mt-1">Taken</p>
        </div>
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-red-700">{missed.length}</p>
          <p className="text-xl font-semibold text-red-600 mt-1">Missed</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-blue-700">{pending.length}</p>
          <p className="text-xl font-semibold text-blue-600 mt-1">Pending</p>
        </div>
      </div>

      {/* All meds */}
      {medications.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-md border border-slate-100">
          <Pill className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <p className="text-2xl text-slate-400">No medications added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medications.map((med, i) => {
            const [h, min] = (med.time || med.scheduleTime || "00:00").split(":").map(Number);
            const t = new Date(); t.setHours(h, min, 0, 0);
            const isOverdue = !med.taken && now > t;
            const isPending = !med.taken && now <= t;

            return (
              <div
                key={i}
                className={`bg-white rounded-2xl shadow-md border-l-8 p-7 ${
                  med.taken   ? "border-green-400" :
                  isOverdue   ? "border-red-400"   : "border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-800">{med.name}</h3>
                    <p className="text-xl text-slate-500 mt-1">
                      {med.dosage} · {med.time || med.scheduleTime} · {med.frequency}
                    </p>
                  </div>
                  <div>
                    {med.taken ? (
                      <span className="flex items-center gap-2 text-green-600 font-bold text-2xl">
                        <CheckCircle className="w-8 h-8" /> Taken
                      </span>
                    ) : isOverdue ? (
                      <span className="flex items-center gap-2 text-red-600 font-bold text-2xl">
                        <XCircle className="w-8 h-8" /> Missed
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
                        <Clock className="w-8 h-8" /> Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}