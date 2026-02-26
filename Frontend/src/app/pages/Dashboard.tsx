import { Link } from "react-router";
import {
  Activity, Pill, Calendar, Phone, AlertCircle, Sun, Mic, Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  CheckIn as CheckInApi, Analysis, speak, DEFAULT_USER,
} from "../../utils/sevaApi";
import { computeCaregiverOverview } from "../../utils/localAnalysis";
import { useVoice } from "../../utils/useVoice";

interface CheckInEntry {
  status: "fine" | "unwell" | "help";
  timestamp: string;
  transcriptText?: string;
}

interface Overview {
  missedMedicines: { id: string; name: string; scheduleTime: string }[];
  inactivity: { inactive: boolean; hoursAgo: number | null; message: string };
}

function loadCheckIns(): CheckInEntry[] {
  return JSON.parse(localStorage.getItem("seva_checkins") || "[]");
}
function saveCheckIn(c: CheckInEntry) {
  const list = loadCheckIns();
  list.push(c);
  localStorage.setItem("seva_checkins", JSON.stringify(list));
}

export function Dashboard() {
  const [upcomingMeds,  setUpcomingMeds]  = useState<any[]>([]);
  const [medicines,     setMedicines]     = useState<any[]>([]);
  const [checkIns,      setCheckIns]      = useState<CheckInEntry[]>([]);
  const [symptoms,      setSymptoms]      = useState<any[]>([]);
  const [overview,      setOverview]      = useState<Overview | null>(null);
  const [lastCheckIn,   setLastCheckIn]   = useState<CheckInEntry | null>(null);
  const [checkingIn,    setCheckingIn]    = useState(false);
  const [inactiveAlert, setInactiveAlert] = useState<string | null>(null);

  const voice = useVoice();

  const takenCount    = medicines.filter((m: any) => m.taken).length;
  const totalMedCount = medicines.length;

  useEffect(() => {
    const stored = localStorage.getItem("medications");
    if (stored) {
      const meds = JSON.parse(stored);
      const now  = new Date();
      const upcoming = meds.filter((med: any) => {
        const [h, m] = med.time.split(":");
        const t = new Date();
        t.setHours(parseInt(h), parseInt(m), 0);
        return t > now;
      }).slice(0, 5);
      setUpcomingMeds(upcoming);
      setMedicines(meds);
    }

    const ci = loadCheckIns();
    setCheckIns(ci);
    if (ci.length > 0) setLastCheckIn(ci[ci.length - 1]);

    const checkInactivity = async () => {
      const data = await Analysis.inactivity(DEFAULT_USER);
      if (data?.inactive) {
        setInactiveAlert(data.message || "⚠️ No activity detected. Are you okay?");
        speak("Hello! I noticed you haven't been active. Are you feeling okay?");
      } else {
        setInactiveAlert(null);
      }
    };
    checkInactivity();
    const timer = setInterval(checkInactivity, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const result = computeCaregiverOverview(medicines, checkIns, symptoms);
    setOverview(result as any);
  }, [medicines, checkIns, symptoms]);

  const handleCheckIn = async (feeling: "fine" | "unwell") => {
    setCheckingIn(true);
    const textMap = { fine: "I am feeling fine today", unwell: "I am not feeling well today" };
    const result = await CheckInApi.morning(textMap[feeling], DEFAULT_USER);
    const entry: CheckInEntry = {
      status: feeling, timestamp: new Date().toISOString(), transcriptText: textMap[feeling],
    };
    saveCheckIn(entry);
    setCheckIns(loadCheckIns());
    setLastCheckIn(entry);
    if (feeling === "fine") {
      speak(result?.ttsReply || "Great! I'm glad you're feeling fine today. Have a wonderful day!");
    } else {
      speak("I'm sorry to hear that. Your caretaker has been notified about your health condition. Please rest and take care.");
    }
    if (feeling === "unwell") toast.warning("⚠️ Your caretaker has been notified!", { duration: 5000 });
    else toast.success("Check-in recorded!");
    setCheckingIn(false);
  };

  const handleVoiceCheckIn = async () => {
    try {
      voice.reset();
      // 🟢 If running inside Android WebView
      if ((window as any).AndroidBridge) {
        const { runMorningCheckIn } = await import("../../utils/sevaApi");
        await runMorningCheckIn(DEFAULT_USER);
        return;
      }
      // 🔵 Browser fallback
      speak("Good morning! How are you feeling today?");
      await new Promise<void>(r => setTimeout(r, 2000));
      const transcript = await voice.listen();
      if (!transcript) {
        toast.error("Could not hear you. Please try again.");
        return;
      }
      const result = await CheckInApi.morning(transcript, DEFAULT_USER);
      if (!result) {
        toast.error("Server not reachable.");
        return;
      }
      if (result.ttsReply) speak(result.ttsReply);

      // Save check-in entry WITH transcript so caregiver can see exactly what was said
      const entry: CheckInEntry = {
        status: result.status ?? "fine",
        timestamp: new Date().toISOString(),
        transcriptText: transcript,
      };
      saveCheckIn(entry);
      setCheckIns(loadCheckIns());
      setLastCheckIn(entry);

      // Notify caregiver if patient is unwell or needs help
      if (result.status === "unwell" || result.status === "help") {
        toast.warning("⚠️ Your caretaker has been notified!", { duration: 5000 });
      } else {
        toast.success(`Check-in saved: ${result.status}`);
      }
    } catch (err) {
      toast.error("Voice check-in failed.");
    }
  };

  const quickActions = [
    { title: "Emergency\nSOS",   icon: Phone,    link: "/dashboard/emergency",    color: "bg-red-500 hover:bg-red-600"       },
    { title: "Log Health\nData", icon: Activity, link: "/dashboard/health",       color: "bg-green-500 hover:bg-green-600"   },
    { title: "My\nMedications",  icon: Pill,     link: "/dashboard/medications",  color: "bg-purple-500 hover:bg-purple-600" },
    { title: "Appointments",     icon: Calendar, link: "/dashboard/appointments", color: "bg-blue-500 hover:bg-blue-600"     },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div>
        <h2 className="text-6xl font-bold text-gray-800 mb-3">Welcome Back! 👋</h2>
        <p className="text-3xl text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Inactivity Alert */}
      {inactiveAlert && (
        <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-8 flex items-center gap-5">
          <span className="text-5xl">⚠️</span>
          <p className="text-3xl font-bold text-red-700 flex-1">{inactiveAlert}</p>
          <button onClick={() => setInactiveAlert(null)} className="text-red-400 hover:text-red-600 text-4xl font-bold">✕</button>
        </div>
      )}

      {/* Daily Check-In */}
      <div className={`bg-white rounded-2xl shadow-lg p-10 border-l-8 ${
        lastCheckIn?.status === "unwell" ? "border-orange-400" : "border-yellow-400"
      }`}>
        <h3 className="text-4xl font-bold text-gray-800 mb-4 flex items-center gap-3">
          <Sun className="w-12 h-12 text-yellow-400" /> Daily Check-In
        </h3>
        {lastCheckIn ? (
          <div className="mt-2 mb-8">
            <span className={`inline-block px-8 py-3 rounded-full text-2xl font-bold ${
              lastCheckIn.status === "fine" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            }`}>
              {lastCheckIn.status === "fine" ? "✅ Feeling Fine" : "⚠️ Not Feeling Well"}
            </span>
            {lastCheckIn.status === "unwell" && (
              <div className="mt-6 bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 flex items-center gap-4">
                <span className="text-4xl">📢</span>
                <div>
                  <p className="text-2xl font-bold text-orange-700">Your caretaker has been notified about your health condition.</p>
                  <p className="text-xl text-orange-500 mt-1">Please rest and take care of yourself.</p>
                </div>
              </div>
            )}
            {lastCheckIn.transcriptText && (
              <p className="text-2xl text-gray-500 mt-4 italic">You said: "{lastCheckIn.transcriptText}"</p>
            )}
            <p className="text-2xl text-gray-500 mt-6 mb-2">Update your status:</p>
          </div>
        ) : (
          <p className="text-3xl text-gray-500 mt-3 mb-8">How are you feeling today?</p>
        )}

        {/* Voice Check-In Button */}
        <button
          onClick={handleVoiceCheckIn}
          disabled={voice.isListening || checkingIn}
          className="mb-6 w-full px-8 py-6 bg-indigo-500 text-white rounded-2xl text-3xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50 shadow-md flex items-center justify-center gap-3"
        >
          {voice.isListening
            ? <><Loader2 className="w-8 h-8 animate-spin" /> Listening…</>
            : <><Mic className="w-8 h-8" /> Voice Check-In</>
          }
        </button>
        {voice.transcript && <p className="mb-4 text-2xl text-gray-500 italic">You said: "{voice.transcript}"</p>}
        {voice.error      && <p className="mb-4 text-2xl text-red-500">{voice.error}</p>}

        <div className="flex flex-wrap gap-5">
          <button onClick={() => handleCheckIn("fine")} disabled={checkingIn || voice.isListening}
            className="flex-1 min-w-[200px] px-8 py-8 bg-green-500 text-white rounded-2xl text-3xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50 shadow-md">
            😊 I'm Fine
          </button>
          <button onClick={() => handleCheckIn("unwell")} disabled={checkingIn || voice.isListening}
            className="flex-1 min-w-[200px] px-8 py-8 bg-orange-500 text-white rounded-2xl text-3xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md">
            😟 Not Feeling Well
          </button>
        </div>
      </div>

      {/* Upcoming Medications */}
      <div className="bg-white rounded-2xl shadow-lg p-10 border-l-8 border-purple-400">
        <h3 className="text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Pill className="w-12 h-12 text-purple-500" /> Upcoming Medications
        </h3>
        {upcomingMeds.length > 0 ? (
          <div className="space-y-5">
            {upcomingMeds.map((med: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-8 bg-purple-50 rounded-2xl border border-purple-100">
                <div>
                  <p className="text-3xl font-bold text-gray-800">{med.name}</p>
                  <p className="text-2xl text-gray-500 mt-2">{med.dosage}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-bold text-purple-600">{med.time}</p>
                  <p className="text-xl text-gray-400 mt-2">{med.frequency || "Daily"}</p>
                </div>
              </div>
            ))}
            <Link to="/dashboard/medications"
              className="block text-center text-purple-600 hover:text-purple-700 font-bold text-3xl mt-5 py-5 border-2 border-purple-300 rounded-2xl hover:bg-purple-50 transition-colors">
              View All Medications →
            </Link>
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-28 h-28 text-gray-300 mx-auto mb-6" />
            <p className="text-3xl text-gray-500 mb-8">No upcoming medications scheduled</p>
            <Link to="/dashboard/medications"
              className="inline-block px-10 py-6 bg-purple-500 text-white rounded-2xl text-3xl font-bold hover:bg-purple-600 transition-colors">
              Add Medications
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.title} to={action.link}
              className={`${action.color} text-white p-9 rounded-2xl shadow-lg transition-transform hover:scale-105 flex flex-col items-start`}>
              <Icon className="w-14 h-14 mb-5" />
              <h3 className="text-3xl font-bold leading-snug whitespace-pre-line">{action.title}</h3>
            </Link>
          );
        })}
      </div>

      {/* Today's Summary */}
      {(() => {
        const now = new Date();
        const missedCount = medicines.filter((m: any) => {
          if (m.taken) return false;
          const [h, min] = m.time.split(":").map(Number);
          const medTime = new Date(); medTime.setHours(h, min, 0, 0);
          return now > medTime;
        }).length;
        return (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl shadow-lg p-10">
            <h3 className="text-4xl font-bold mb-8">📋 Today's Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-2xl opacity-90 mb-3">Medications Taken</p>
                <p className="text-6xl font-bold">{takenCount}/{totalMedCount}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-2xl opacity-90 mb-3">Missed Medicines</p>
                <p className="text-6xl font-bold">{missedCount}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
                <p className="text-2xl opacity-90 mb-3">Activity Status</p>
                <p className="text-4xl font-bold mt-2">
                  {overview?.inactivity.inactive ? "⚠️ Inactive" : "✅ Active"}
                </p>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}