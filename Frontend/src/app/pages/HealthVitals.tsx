import { useState, useEffect } from "react";
import {
  Activity, Heart, Droplet, Plus, TrendingUp,
  Mic, AlertTriangle, Loader2,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";

// FIX: correct path — pages are in src/app/pages/, utils in src/app/utils/
import { Symptoms, runVoiceSymptomLog, DEFAULT_USER } from "../../utils/sevaApi";
import { useVoice } from "../../utils/useVoice";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VitalReading {
  id: string; date: string;
  bloodPressureSystolic: number; bloodPressureDiastolic: number;
  heartRate: number; bloodSugar: number; weight: number;
}

interface Symptom {
  id: string; timestamp: string; transcriptText: string; critical: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HealthVitals() {
  const [readings,       setReadings]       = useState<VitalReading[]>([]);
  const [showAddForm,    setShowAddForm]     = useState(false);
  const [symptoms,       setSymptoms]       = useState<Symptom[]>([]);
  const [symptomText,    setSymptomText]    = useState("");
  const [loggingSymptom, setLoggingSymptom] = useState(false);
  const [newReading, setNewReading] = useState({
    bloodPressureSystolic: "", bloodPressureDiastolic: "",
    heartRate: "", bloodSugar: "", weight: "",
  });

  const voice = useVoice();

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("healthVitals");
    if (stored) {
      setReadings(JSON.parse(stored));
    } else {
      const sample: VitalReading[] = [
        { id: "1", date: new Date(Date.now() - 6*86400000).toISOString(), bloodPressureSystolic: 120, bloodPressureDiastolic: 80, heartRate: 72, bloodSugar: 95,  weight: 75   },
        { id: "2", date: new Date(Date.now() - 5*86400000).toISOString(), bloodPressureSystolic: 118, bloodPressureDiastolic: 78, heartRate: 70, bloodSugar: 92,  weight: 75   },
        { id: "3", date: new Date(Date.now() - 4*86400000).toISOString(), bloodPressureSystolic: 122, bloodPressureDiastolic: 82, heartRate: 74, bloodSugar: 98,  weight: 74.5 },
      ];
      setReadings(sample);
      localStorage.setItem("healthVitals", JSON.stringify(sample));
    }

    Symptoms.getAll(DEFAULT_USER).then((data: any) => {
      if (data?.symptoms) setSymptoms(data.symptoms);
    });
  }, []);

  // ── Vitals ────────────────────────────────────────────────────────────────
  const saveReadings = (r: VitalReading[]) => {
    localStorage.setItem("healthVitals", JSON.stringify(r));
    setReadings(r);
  };

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
    toast.success("Health vitals recorded!");
  };

  // ── Text symptom ──────────────────────────────────────────────────────────
  const handleLogSymptom = async () => {
    if (!symptomText.trim()) { toast.error("Please describe your symptom first"); return; }
    setLoggingSymptom(true);

    const result: any = await Symptoms.log(symptomText.trim(), DEFAULT_USER);

    if (result) {
      if (result.critical) toast.error("⚠️ Critical symptom detected! Caregiver has been alerted.");
      else                 toast.success("Symptom logged!");
      Symptoms.getAll(DEFAULT_USER).then((d: any) => { if (d?.symptoms) setSymptoms(d.symptoms); });
    } else {
      const local: Symptom = {
        id: Date.now().toString(), timestamp: new Date().toISOString(),
        transcriptText: symptomText.trim(), critical: false,
      };
      setSymptoms(prev => [local, ...prev]);
      toast.success("Symptom saved locally.");
    }

    setSymptomText("");
    setLoggingSymptom(false);
  };

  // ── Voice symptom ─────────────────────────────────────────────────────────
  const handleVoiceSymptom = async () => {
    voice.reset();
    const result: any = await runVoiceSymptomLog(DEFAULT_USER);
    if (!result) {
      toast.error("Could not log symptom. Please type it instead.");
      return;
    }
    if (result.critical) toast.error("🚨 Critical symptom detected! Caregiver alerted.");
    else                 toast.success("Symptom logged via voice!");
    Symptoms.getAll(DEFAULT_USER).then((d: any) => { if (d?.symptoms) setSymptoms(d.symptoms); });
  };

  // ── Chart ─────────────────────────────────────────────────────────────────
  const chartData = readings.slice(-7).map((r: VitalReading) => ({
    date:          new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    "BP Systolic": r.bloodPressureSystolic,
    "Heart Rate":  r.heartRate,
    "Blood Sugar": r.bloodSugar,
  }));

  const latestReading = readings[readings.length - 1];

  const formFields = [
    { label: "Blood Pressure (Systolic)",  key: "bloodPressureSystolic",  placeholder: "120",  step: "1"   },
    { label: "Blood Pressure (Diastolic)", key: "bloodPressureDiastolic", placeholder: "80",   step: "1"   },
    { label: "Heart Rate (bpm)",           key: "heartRate",              placeholder: "72",   step: "1"   },
    { label: "Blood Sugar (mg/dL)",        key: "bloodSugar",             placeholder: "95",   step: "1"   },
    { label: "Weight (kg)",                key: "weight",                 placeholder: "75.0", step: "0.1" },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Activity className="w-10 h-10 text-green-500" /> Health Vitals
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" /> Log Vitals
        </button>
      </div>

      {/* Add Reading Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Log Health Vitals</h3>
          <form onSubmit={addReading} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {formFields.map(f => (
                <div key={f.key}>
                  <label className="block text-lg font-semibold text-gray-700 mb-2">{f.label}</label>
                  <input
                    type="number"
                    step={f.step}
                    value={(newReading as any)[f.key]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewReading({ ...newReading, [f.key]: e.target.value })
                    }
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button type="submit"
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600">
                Save Reading
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Current Stats */}
      {latestReading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Heart,      label: "Blood Pressure", value: `${latestReading.bloodPressureSystolic}/${latestReading.bloodPressureDiastolic}`, unit: "mmHg",  color: "from-red-500 to-red-600"    },
            { icon: Activity,   label: "Heart Rate",     value: latestReading.heartRate,                                                          unit: "bpm",   color: "from-pink-500 to-pink-600"   },
            { icon: Droplet,    label: "Blood Sugar",    value: latestReading.bloodSugar,                                                         unit: "mg/dL", color: "from-blue-500 to-blue-600"   },
            { icon: TrendingUp, label: "Weight",         value: latestReading.weight,                                                             unit: "kg",    color: "from-green-500 to-green-600" },
          ].map((stat) => (
            <div key={stat.label} className={`bg-gradient-to-br ${stat.color} text-white rounded-xl shadow-lg p-6`}>
              <stat.icon className="w-10 h-10 mb-3" />
              <p className="text-lg opacity-90 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80 mt-2">{stat.unit}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
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

      {/* Recent Readings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Recent Readings</h3>
        <div className="space-y-3">
          {readings.slice(-5).reverse().map((r: VitalReading) => (
            <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(r.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
                <p className="text-gray-600">
                  {new Date(r.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:flex gap-4 text-center">
                <div><p className="text-sm text-gray-600">BP</p>     <p className="text-lg font-semibold">{r.bloodPressureSystolic}/{r.bloodPressureDiastolic}</p></div>
                <div><p className="text-sm text-gray-600">HR</p>     <p className="text-lg font-semibold">{r.heartRate}</p></div>
                <div><p className="text-sm text-gray-600">Sugar</p>  <p className="text-lg font-semibold">{r.bloodSugar}</p></div>
                <div><p className="text-sm text-gray-600">Weight</p> <p className="text-lg font-semibold">{r.weight}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Symptom Logger */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
        <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Mic className="w-7 h-7 text-green-500" /> Log a Symptom
        </h3>
        <p className="text-gray-500 mb-4">
          Describe how you're feeling — this will alert your caregiver if serious.
        </p>

        {/* Voice button */}
        <button
          onClick={handleVoiceSymptom}
          disabled={voice.isListening || loggingSymptom}
          className="mb-4 px-6 py-3 bg-indigo-500 text-white rounded-xl text-lg font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {voice.isListening
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Listening…</>
            : <><Mic className="w-5 h-5" /> Speak Symptom</>
          }
        </button>

        {voice.transcript && (
          <p className="mb-3 text-sm text-gray-500 italic">You said: "{voice.transcript}"</p>
        )}
        {voice.error && (
          <p className="mb-3 text-sm text-red-500">{voice.error}</p>
        )}

        {/* Text fallback */}
        <div className="flex gap-3">
          <input
            type="text"
            value={symptomText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSymptomText(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleLogSymptom()}
            placeholder="e.g. I have a headache and feel dizzy..."
            className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
          />
          <button
            onClick={handleLogSymptom}
            disabled={loggingSymptom || voice.isListening}
            className="px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {loggingSymptom ? "Saving…" : "Log"}
          </button>
        </div>
      </div>

      {/* Symptom History */}
      {symptoms.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-orange-500" /> Symptom History
          </h3>
          <div className="space-y-3">
            {symptoms.slice(0, 5).map((s: Symptom) => (
              <div key={s.id} className={`p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 ${
                s.critical ? "bg-red-50 border-l-4 border-red-500" : "bg-gray-50 border-l-4 border-gray-300"
              }`}>
                <div>
                  <p className="text-lg font-medium text-gray-800">{s.transcriptText}</p>
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
