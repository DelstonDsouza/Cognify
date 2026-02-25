import { useState, useEffect, useRef, useCallback } from "react";
import { Pill, Plus, Trash2, Clock, Check, X, AlarmClock } from "lucide-react";
import { toast } from "sonner";

import { Medicines, DEFAULT_USER } from "../../utils/sevaApi";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
  snoozedUntil?: string; // ISO string — if set, don't ring until this time
  alarmDismissedAt?: string; // date string "YYYY-MM-DD" — already handled today
}

interface AlarmPopup {
  medId: string;
  medName: string;
  dosage: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the medicine time has passed/arrived today and it hasn't been taken */
function isMedicineTime(med: Medication): boolean {
  const now = new Date();
  const [h, m] = med.time.split(":").map(Number);
  const medTime = new Date();
  medTime.setHours(h, m, 0, 0);
  return now >= medTime;
}

/** Returns a friendly label for how long until/since medicine time */
function timeLabel(med: Medication): { text: string; color: string; isPending: boolean } {
  const now = new Date();
  const [h, m] = med.time.split(":").map(Number);
  const medTime = new Date();
  medTime.setHours(h, m, 0, 0);
  const diffMs = medTime.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (med.taken) return { text: "✅ Taken", color: "text-green-600", isPending: false };

  if (diffMin > 60) {
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return {
      text: `⏰ Due in ${hrs}h ${mins > 0 ? mins + "m" : ""}`,
      color: "text-blue-500",
      isPending: true,
    };
  }
  if (diffMin > 0) {
    return { text: `⏰ Due in ${diffMin} min`, color: "text-orange-500", isPending: true };
  }
  if (diffMin > -30) {
    return { text: `🔔 Due now!`, color: "text-red-600", isPending: true };
  }
  return { text: `⚠️ ${Math.abs(diffMin)} min overdue`, color: "text-red-700", isPending: true };
}

/** Play a simple alarm beep using Web Audio API */
function playAlarm() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration + 0.05);
    };
    // Three ascending beeps
    playTone(880, 0, 0.25);
    playTone(1100, 0.3, 0.25);
    playTone(1320, 0.6, 0.4);
    playTone(880, 1.2, 0.25);
    playTone(1100, 1.5, 0.25);
    playTone(1320, 1.8, 0.5);
  } catch {
    // ignore if audio not available
  }
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function Medications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newMed, setNewMed] = useState({ name: "", dosage: "", time: "", frequency: "daily" });
  const [alarm, setAlarm] = useState<AlarmPopup | null>(null);
  const alarmInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmSoundInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("medications");
    if (stored) setMedications(JSON.parse(stored));
  }, []);

  const saveMedications = (meds: Medication[]) => {
    localStorage.setItem("medications", JSON.stringify(meds));
    setMedications(meds);
  };



  // ── Alarm checker — runs every 30 seconds ──────────────────────────────────
  const checkAlarms = useCallback(() => {
    const stored = localStorage.getItem("medications");
    if (!stored) return;
    const meds: Medication[] = JSON.parse(stored);
    const now = new Date();
    const today = todayStr();

    for (const med of meds) {
      if (med.taken) continue;
      if (med.alarmDismissedAt === today) continue; // already handled today

      // Check snooze
      if (med.snoozedUntil) {
        const snoozeTime = new Date(med.snoozedUntil);
        if (now < snoozeTime) continue;
      }

      const [h, m] = med.time.split(":").map(Number);
      const medTime = new Date();
      medTime.setHours(h, m, 0, 0);

      // Trigger alarm within a ±1 minute window of medicine time
      const diffMs = now.getTime() - medTime.getTime();
      if (diffMs >= 0 && diffMs < 60000) {
        setAlarm({ medId: med.id, medName: med.name, dosage: med.dosage });
        playAlarm();
        // Repeat alarm sound every 30s while popup is open
        if (alarmSoundInterval.current) clearInterval(alarmSoundInterval.current);
        alarmSoundInterval.current = setInterval(playAlarm, 30000);
        break;
      }
    }
  }, []);

  useEffect(() => {
    alarmInterval.current = setInterval(checkAlarms, 30000);
    checkAlarms(); // also run immediately on mount
    return () => {
      if (alarmInterval.current) clearInterval(alarmInterval.current);
      if (alarmSoundInterval.current) clearInterval(alarmSoundInterval.current);
    };
  }, [checkAlarms]);

  // Stop repeating alarm sound when popup closes
  useEffect(() => {
    if (!alarm && alarmSoundInterval.current) {
      clearInterval(alarmSoundInterval.current);
      alarmSoundInterval.current = null;
    }
  }, [alarm]);

  // ── Alarm actions ─────────────────────────────────────────────────────────
  const handleAlarmTaken = async () => {
    if (!alarm) return;
    const updated = medications.map((m) =>
      m.id === alarm.medId
        ? { ...m, taken: true, alarmDismissedAt: todayStr(), snoozedUntil: undefined }
        : m
    );
    saveMedications(updated);
    await Medicines.markTaken(alarm.medId, DEFAULT_USER);
    toast.success(`✅ Great! ${alarm.medName} marked as taken.`);
    setAlarm(null);
  };

  const handleAlarmSnooze = () => {
    if (!alarm) return;
    const snoozeUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min snooze
    const updated = medications.map((m) =>
      m.id === alarm.medId ? { ...m, snoozedUntil: snoozeUntil } : m
    );
    saveMedications(updated);
    toast.info(`⏰ Reminder snoozed for 15 minutes.`);
    setAlarm(null);
  };

  // ── Add ───────────────────────────────────────────────────────────────────
  const addMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage || !newMed.time) {
      toast.error("Please fill in all fields");
      return;
    }
    const med: Medication = { id: Date.now().toString(), ...newMed, taken: false };
    saveMedications([...medications, med]);
    await Medicines.add(newMed.name, newMed.dosage, newMed.time, DEFAULT_USER);
    setNewMed({ name: "", dosage: "", time: "", frequency: "daily" });
    setShowAddForm(false);
    toast.success("Medication added!");
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMedication = (id: string) => {
    saveMedications(medications.filter((m: Medication) => m.id !== id));
    toast.success("Medication removed");
  };

  // ── Toggle taken ──────────────────────────────────────────────────────────
  const toggleTaken = async (id: string) => {
    const updated = medications.map((m: Medication) =>
      m.id === id
        ? { ...m, taken: !m.taken, alarmDismissedAt: !m.taken ? todayStr() : undefined }
        : m
    );
    saveMedications(updated);
    const med = updated.find((m: Medication) => m.id === id);
    if (med?.taken) {
      await Medicines.markTaken(id, DEFAULT_USER);
      toast.success(`✅ Marked ${med.name} as taken`);
    } else {
      await Medicines.markSkipped(id, DEFAULT_USER);
      toast.success(`Unmarked ${med?.name}`);
    }
  };

  const formFields = [
    { label: "Medication Name", key: "name",   type: "text", placeholder: "e.g., Aspirin" },
    { label: "Dosage",          key: "dosage", type: "text", placeholder: "e.g., 100mg"   },
    { label: "Time",            key: "time",   type: "time", placeholder: ""              },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">

      {/* ── Alarm Popup ── */}
      {alarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-10 mx-6 max-w-lg w-full border-4 border-purple-400 animate-bounce-once">
            {/* Pulsing bell icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                <AlarmClock className="w-14 h-14 text-purple-600" />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-center text-gray-800 mb-3">
              💊 Time for Your Medicine!
            </h2>
            <p className="text-3xl text-center font-bold text-purple-700 mb-2">
              {alarm.medName}
            </p>
            <p className="text-2xl text-center text-gray-500 mb-10">
              Dosage: {alarm.dosage}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleAlarmTaken}
                className="w-full py-6 bg-green-500 hover:bg-green-600 text-white rounded-2xl text-3xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <Check className="w-9 h-9" />
                Yes, I've Taken It!
              </button>
              <button
                onClick={handleAlarmSnooze}
                className="w-full py-6 bg-orange-400 hover:bg-orange-500 text-white rounded-2xl text-3xl font-bold transition-colors flex items-center justify-center gap-3 shadow-lg"
              >
                <Clock className="w-9 h-9" />
                Remind Me in 15 Minutes
              </button>
              <button
                onClick={() => setAlarm(null)}
                className="w-full py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-2xl font-bold transition-colors flex items-center justify-center gap-3"
              >
                <X className="w-7 h-7" />
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
        <h2 className="text-4xl sm:text-5xl font-bold text-gray-800 flex items-center gap-3">
          <Pill className="w-12 h-12 text-purple-500" />
          My Medications
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-8 py-5 bg-purple-500 text-white rounded-2xl text-2xl font-bold hover:bg-purple-600 transition-colors flex items-center gap-3 shadow-lg"
        >
          <Plus className="w-8 h-8" />
          Add Medication
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-3xl font-bold text-gray-800 mb-6">Add New Medication</h3>
          <form onSubmit={addMedication} className="space-y-5">
            {formFields.map(f => (
              <div key={f.key}>
                <label className="block text-xl font-bold text-gray-700 mb-2">{f.label}</label>
                <input
                  type={f.type}
                  value={(newMed as any)[f.key]}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewMed({ ...newMed, [f.key]: e.target.value })
                  }
                  className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
                  placeholder={f.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">Frequency</label>
              <select
                value={newMed.frequency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setNewMed({ ...newMed, frequency: e.target.value })
                }
                className="w-full px-5 py-4 text-xl border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="twice-daily">Twice Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as-needed">As Needed</option>
              </select>
            </div>
            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                className="flex-1 px-6 py-5 bg-purple-500 text-white rounded-2xl text-2xl font-bold hover:bg-purple-600 transition-colors"
              >
                Save Medication
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-5 bg-gray-200 text-gray-700 rounded-2xl text-2xl font-bold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Medications List */}
      <div className="space-y-5">
        {medications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <Pill className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <p className="text-2xl text-gray-500 mb-6">No medications added yet</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-8 py-5 bg-purple-500 text-white rounded-2xl text-2xl font-bold hover:bg-purple-600 transition-colors"
            >
              Add Your First Medication
            </button>
          </div>
        ) : (
          medications.map((med: Medication) => {
            const status = timeLabel(med);
            const isBeforeTime = !isMedicineTime(med) && !med.taken;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-2xl shadow-lg p-7 transition-all border-l-8 ${
                  med.taken
                    ? "border-green-400 opacity-70"
                    : isBeforeTime
                    ? "border-blue-300"
                    : "border-orange-400"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">

                  {/* Medicine details */}
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-800 mb-3">{med.name}</h3>
                    <div className="space-y-1">
                      <p className="text-xl text-gray-600">
                        <span className="font-bold">Dosage:</span> {med.dosage}
                      </p>
                      <p className="text-xl text-gray-600 flex items-center gap-2">
                        <Clock className="w-6 h-6 text-gray-400" />
                        <span className="font-bold">Time:</span> {med.time}
                      </p>
                      <p className="text-xl text-gray-600">
                        <span className="font-bold">Frequency:</span> {med.frequency}
                      </p>
                    </div>

                    {/* Time status badge */}
                    <div className={`mt-3 inline-block text-xl font-bold ${status.color}`}>
                      {status.text}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 flex-wrap">
                    <button
                      onClick={() => toggleTaken(med.id)}
                      disabled={isBeforeTime && !med.taken}
                      title={isBeforeTime ? `Available at ${med.time}` : undefined}
                      className={`px-7 py-5 rounded-2xl text-xl font-bold transition-colors flex items-center gap-3 ${
                        med.taken
                          ? "bg-green-500 text-white"
                          : isBeforeTime
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
                      }`}
                    >
                      <Check className="w-7 h-7" />
                      {med.taken
                        ? "Taken ✓"
                        : isBeforeTime
                        ? `Available at ${med.time}`
                        : "Mark as Taken"}
                    </button>

                    <button
                      onClick={() => deleteMedication(med.id)}
                      className="px-5 py-5 bg-red-100 text-red-600 rounded-2xl hover:bg-red-200 transition-colors"
                      aria-label="Delete medication"
                    >
                      <Trash2 className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}