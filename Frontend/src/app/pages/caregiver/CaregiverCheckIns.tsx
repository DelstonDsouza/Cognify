import { useEffect, useState, useCallback } from "react";
import { ClipboardList } from "lucide-react";

interface CheckIn {
  status: "fine" | "unwell" | "help";
  timestamp: string;
  transcriptText?: string;
}

export function CaregiverCheckIns() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  const load = useCallback(() => {
    const stored = localStorage.getItem("seva_checkins");
    const all: CheckIn[] = stored ? JSON.parse(stored) : [];
    setCheckIns([...all].reverse()); // most recent first
  }, []);

  useEffect(() => {
    load();
    window.addEventListener("caregiver-refresh", load);
    return () => window.removeEventListener("caregiver-refresh", load);
  }, [load]);

  const today = new Date().toDateString();
  const todayCount = checkIns.filter(c => new Date(c.timestamp).toDateString() === today).length;
  const fineCount  = checkIns.filter(c => c.status === "fine").length;
  const unwellCount = checkIns.filter(c => c.status === "unwell").length;
  const helpCount  = checkIns.filter(c => c.status === "help").length;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-5xl font-bold text-slate-800 flex items-center gap-3 mb-2">
          <ClipboardList className="w-12 h-12 text-blue-500" />
          Check-in History
        </h2>
        <p className="text-xl text-slate-500">All patient check-ins recorded</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-blue-700">{todayCount}</p>
          <p className="text-xl font-semibold text-blue-600 mt-1">Today</p>
        </div>
        <div className="bg-green-50 border-2 border-green-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-green-700">{fineCount}</p>
          <p className="text-xl font-semibold text-green-600 mt-1">😊 Fine</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-orange-700">{unwellCount}</p>
          <p className="text-xl font-semibold text-orange-600 mt-1">😟 Unwell</p>
        </div>
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 text-center">
          <p className="text-5xl font-bold text-red-700">{helpCount}</p>
          <p className="text-xl font-semibold text-red-600 mt-1">🚨 Help</p>
        </div>
      </div>

      {/* Timeline */}
      {checkIns.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center shadow-md border border-slate-100">
          <ClipboardList className="w-20 h-20 text-slate-300 mx-auto mb-4" />
          <p className="text-2xl text-slate-400">No check-ins recorded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {checkIns.map((c, i) => (
            <div
              key={i}
              className={`bg-white rounded-2xl shadow-md border-l-8 p-7 ${
                c.status === "fine"   ? "border-green-400" :
                c.status === "help"   ? "border-red-400"   : "border-orange-400"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <span className="text-4xl">
                    {c.status === "fine" ? "😊" : c.status === "help" ? "🚨" : "😟"}
                  </span>
                  <div>
                    <p className={`text-2xl font-bold ${
                      c.status === "fine"   ? "text-green-700" :
                      c.status === "help"   ? "text-red-700"   : "text-orange-700"
                    }`}>
                      {c.status === "fine" ? "Feeling Fine" :
                       c.status === "help" ? "Needed Help"  : "Not Feeling Well"}
                    </p>
                    {c.transcriptText && (
                      <p className="text-xl text-slate-600 italic mt-1">"{c.transcriptText}"</p>
                    )}
                  </div>
                </div>
                <p className="text-lg text-slate-400 shrink-0">
                  {new Date(c.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
