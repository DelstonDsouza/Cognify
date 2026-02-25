import { useState, useEffect } from "react";
import { Activity, Heart, Droplet, Plus, TrendingUp, Mic, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalReading {
  id: string;
  date: string;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  bloodSugar: number;
  weight: number;
}

interface Symptom {
  id: string;
  timestamp: string;
  transcriptText: string;
  critical: boolean;
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

// ── Component ─────────────────────────────────────────────────────────────────

export function HealthVitals() {
  const [readings, setReadings]           = useState<VitalReading[]>([]);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [symptoms, setSymptoms]           = useState<Symptom[]>([]);
  const [symptomText, setSymptomText]     = useState("");
  const [loggingSymptom, setLoggingSymptom] = useState(false);
  const [newReading, setNewReading] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    bloodSugar: "",
    weight: "",
  });

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("healthVitals");
    if (stored) {
      setReadings(JSON.parse(stored));
    } else {
      const sampleData: VitalReading[] = [
        { id: "1", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, bloodSugar: 95,  weight: 75   },
        { id: "2", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), bloodPressureSystolic: 118, bloodPressureDiastolic: 78, heartRate: 70, bloodSugar: 92,  weight: 75   },
        { id: "3", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), bloodPressureSystolic: 122, bloodPressureDiastolic: 82, heartRate: 74, bloodSugar: 98,  weight: 74.5 },
      ];
      setReadings(sampleData);
      localStorage.setItem("healthVitals", JSON.stringify(sampleData));
    }

    // Load symptoms from backend
    apiGet("/api/symptoms?userId=user_001").then((data) => {
      if (data?.symptoms) setSymptoms(data.symptoms);
    });
  }, []);

  // ── Save vitals ───────────────────────────────────────────────────────────
  const saveReadings = (newReadings: VitalReading[]) => {
    localStorage.setItem("healthVitals", JSON.stringify(newReadings));
    setReadings(newReadings);
  };

  // ── Add vital reading — your original logic, unchanged ────────────────────
  const addReading = (e: React.FormEvent) => {
    e.preventDefault();
    const reading: VitalReading = {
      id:                     Date.now().toString(),
      date:                   new Date().toISOString(),
      bloodPressureSystolic:  parseInt(newReading.bloodPressureSystolic)  || 0,
      bloodPressureDiastolic: parseInt(newReading.bloodPressureDiastolic) || 0,
      heartRate:              parseInt(newReading.heartRate)               || 0,
      bloodSugar:             parseInt(newReading.bloodSugar)              || 0,
      weight:                 parseFloat(newReading.weight)                || 0,
    };
    saveReadings([...readings, reading]);
    setNewReading({ bloodPressureSystolic: "", bloodPressureDiastolic: "", heartRate: "", bloodSugar: "", weight: "" });
    setShowAddForm(false);
    toast.success("Health vitals recorded successfully!");
  };

  // ── Log symptom by text ───────────────────────────────────────────────────
  const handleLogSymptom = async () => {
    if (!symptomText.trim()) {
      toast.error("Please describe your symptom first");
      return;
    }
    setLoggingSymptom(true);

    const result = await apiPost("/api/symptoms", {
      userId:         "user_001",
      transcriptText: symptomText.trim(),
    });

    if (result) {
      if (result.critical) {
        toast.error("⚠️ Critical symptom detected! Caregiver has been alerted.");
      } else {
        toast.success("Symptom logged successfully!");
      }
      // Refresh symptoms list from backend
      apiGet("/api/symptoms?userId=user_001").then((data) => {
        if (data?.symptoms) setSymptoms(data.symptoms);
      });
    } else {
      // Backend unreachable — save locally
      const local: Symptom = {
        id:             Date.now().toString(),
        timestamp:      new Date().toISOString(),
        transcriptText: symptomText.trim(),
        critical:       false,
      };
      setSymptoms(prev => [local, ...prev]);
      toast.success("Symptom saved locally.");
    }

    setSymptomText("");
    setLoggingSymptom(false);
  };

  // ── Chart data ────────────────────────────────────────────────────────────
  const chartData = readings.slice(-7).map((reading) => ({
    date:          new Date(reading.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "BP Systolic": reading.bloodPressureSystolic,
    "Heart Rate":  reading.heartRate,
    "Blood Sugar": reading.bloodSugar,
  }));

  const latestReading = readings[readings.length - 1];

  // ── JSX ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header — your original */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="w-10 h-10 text-green-500" />
          Health Vitals
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          Log Vitals
        </button>
      </div>

      {/* Add Reading Form — your original, unchanged */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Log Health Vitals</h3>
          <form onSubmit={addReading} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Blood Pressure (Systolic)</label>
                <input type="number" value={newReading.bloodPressureSystolic}
                  onChange={(e) => setNewReading({ ...newReading, bloodPressureSystolic: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" placeholder="120" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Blood Pressure (Diastolic)</label>
                <input type="number" value={newReading.bloodPressureDiastolic}
                  onChange={(e) => setNewReading({ ...newReading, bloodPressureDiastolic: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" placeholder="80" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Heart Rate (bpm)</label>
                <input type="number" value={newReading.heartRate}
                  onChange={(e) => setNewReading({ ...newReading, heartRate: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" placeholder="72" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Blood Sugar (mg/dL)</label>
                <input type="number" value={newReading.bloodSugar}
                  onChange={(e) => setNewReading({ ...newReading, bloodSugar: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" placeholder="95" />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">Weight (kg)</label>
                <input type="number" step="0.1" value={newReading.weight}
                  onChange={(e) => setNewReading({ ...newReading, weight: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none" placeholder="75.0" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors">
                Save Reading
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Stats — your original, unchanged */}
      {latestReading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6">
            <Heart className="w-10 h-10 mb-3" />
            <p className="text-lg opacity-90 mb-1">Blood Pressure</p>
            <p className="text-3xl font-bold">{latestReading.bloodPressureSystolic}/{latestReading.bloodPressureDiastolic}</p>
            <p className="text-sm opacity-80 mt-2">mmHg</p>
          </div>
          <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-xl shadow-lg p-6">
            <Activity className="w-10 h-10 mb-3" />
            <p className="text-lg opacity-90 mb-1">Heart Rate</p>
            <p className="text-3xl font-bold">{latestReading.heartRate}</p>
            <p className="text-sm opacity-80 mt-2">bpm</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6">
            <Droplet className="w-10 h-10 mb-3" />
            <p className="text-lg opacity-90 mb-1">Blood Sugar</p>
            <p className="text-3xl font-bold">{latestReading.bloodSugar}</p>
            <p className="text-sm opacity-80 mt-2">mg/dL</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
            <TrendingUp className="w-10 h-10 mb-3" />
            <p className="text-lg opacity-90 mb-1">Weight</p>
            <p className="text-3xl font-bold">{latestReading.weight}</p>
            <p className="text-sm opacity-80 mt-2">kg</p>
          </div>
        </div>
      )}

      {/* Charts — your original, unchanged */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Health Trends (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" style={{ fontSize: "14px" }} />
              <YAxis style={{ fontSize: "14px" }} />
              <Tooltip contentStyle={{ fontSize: "16px", padding: "10px" }} />
              <Legend wrapperStyle={{ fontSize: "16px", paddingTop: "20px" }} />
              <Line type="monotone" dataKey="BP Systolic" stroke="#ef4444" strokeWidth={3} />
              <Line type="monotone" dataKey="Heart Rate"  stroke="#ec4899" strokeWidth={3} />
              <Line type="monotone" dataKey="Blood Sugar" stroke="#3b82f6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Readings — your original, unchanged */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Recent Readings</h3>
        <div className="space-y-3">
          {readings.slice(-5).reverse().map((reading) => (
            <div key={reading.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(reading.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-gray-600">
                  {new Date(reading.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-4 text-center">
                <div><p className="text-sm text-gray-600">BP</p><p className="text-lg font-semibold">{reading.bloodPressureSystolic}/{reading.bloodPressureDiastolic}</p></div>
                <div><p className="text-sm text-gray-600">HR</p><p className="text-lg font-semibold">{reading.heartRate}</p></div>
                <div><p className="text-sm text-gray-600">Sugar</p><p className="text-lg font-semibold">{reading.bloodSugar}</p></div>
                <div><p className="text-sm text-gray-600">Weight</p><p className="text-lg font-semibold">{reading.weight}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── NEW: Symptom Logger ── */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Mic className="w-7 h-7 text-green-500" />
          Log a Symptom
        </h3>
        <p className="text-gray-500 mb-4 text-base">
          Describe how you're feeling — this will be sent to your caregiver if serious.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            value={symptomText}
            onChange={(e) => setSymptomText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogSymptom()}
            placeholder="e.g. I have a headache and feel dizzy..."
            className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleLogSymptom}
            disabled={loggingSymptom}
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {loggingSymptom ? "Saving..." : "Log"}
          </button>
        </div>
      </div>

      {/* ── NEW: Symptom History ── */}
      {symptoms.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
            Symptom History
          </h3>
          <div className="space-y-3">
            {symptoms.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                  s.critical
                    ? "bg-red-50 border-l-4 border-red-500"
                    : "bg-gray-50 border-l-4 border-gray-300"
                }`}
              >
                <div>
                  <p className="text-lg font-medium text-gray-800">
                    {s.transcriptText}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(s.timestamp).toLocaleString("en-US", {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {s.critical && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold whitespace-nowrap">
                    🚨 Critical
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}