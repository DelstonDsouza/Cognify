import { useState } from "react";
import { Heart, CheckCircle2, Play, RotateCcw } from "lucide-react";

interface ExerciseEntry {
  id: string;
  name: string;
  duration: string;
  reps?: string;
  category: "yoga" | "exercise" | "breathing";
  completed: boolean;
  icon: string;
}

const DEFAULT_EXERCISES: ExerciseEntry[] = [
  { id: "1", name: "Morning Sun Salutation", duration: "10 min", category: "yoga",     completed: false, icon: "🌅" },
  { id: "2", name: "Chair Yoga Stretches",   duration: "15 min", category: "yoga",     completed: false, icon: "🧘" },
  { id: "3", name: "Deep Breathing",         duration: "5 min",  category: "breathing",completed: false, icon: "🌬️" },
  { id: "4", name: "Seated Leg Raises",      duration: "10 min", reps: "10 reps",      category: "exercise", completed: false, icon: "🦵" },
  { id: "5", name: "Wall Push-Ups",          duration: "5 min",  reps: "8 reps",       category: "exercise", completed: false, icon: "💪" },
  { id: "6", name: "Neck & Shoulder Rolls",  duration: "5 min",  category: "yoga",     completed: false, icon: "🔄" },
  { id: "7", name: "Alternate Nostril Breathing", duration: "5 min", category: "breathing", completed: false, icon: "🌿" },
  { id: "8", name: "Gentle Walking in Place", duration: "10 min", category: "exercise", completed: false, icon: "🚶" },
];

const YOGA_TIPS = [
  "Move slowly and listen to your body",
  "Breathe deeply throughout each pose",
  "Rest when needed – your wellbeing comes first",
  "Consistency matters more than intensity",
];

const categoryColors: Record<string, string> = {
  yoga:      "bg-purple-100 text-purple-700 border-purple-200",
  exercise:  "bg-green-100  text-green-700  border-green-200",
  breathing: "bg-blue-100   text-blue-700   border-blue-200",
};
const categoryLabel: Record<string, string> = {
  yoga: "Yoga", exercise: "Exercise", breathing: "Breathing",
};



export function Activities() {
  const [exercises, setExercises] = useState<ExerciseEntry[]>(DEFAULT_EXERCISES);
  const [activeFilter, setActiveFilter] = useState<"all" | "yoga" | "exercise" | "breathing">("all");

  const completedCount = exercises.filter((e) => e.completed).length;
  const totalCount = exercises.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const tip = YOGA_TIPS[new Date().getDay() % YOGA_TIPS.length];

  const toggleExercise = (id: string) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  };

  const resetAll = () => {
    setExercises((prev) => prev.map((e) => ({ ...e, completed: false })));
  };


  const filtered = activeFilter === "all"
    ? exercises
    : exercises.filter((e) => e.category === activeFilter);

  return (
    <div className="space-y-8 pb-12">

      {/* Header */}
      <div>
        <h2 className="text-5xl font-bold text-gray-800 mb-3 flex items-center gap-3">
          <span className="text-5xl">🧘</span> Yoga & Exercise
        </h2>
        <p className="text-2xl text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </p>
      </div>

      {/* Tip Banner */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-2xl p-6 flex items-center gap-4">
        <span className="text-4xl">💡</span>
        <p className="text-2xl text-purple-800 font-medium">{tip}</p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-l-8 border-purple-400">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-3xl font-bold text-gray-800">Today's Progress</h3>
          <button
            onClick={resetAll}
            className="flex items-center gap-2 text-xl text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw className="w-6 h-6" /> Reset
          </button>
        </div>
        <div className="flex items-end gap-4 mb-4">
          <span className="text-6xl font-bold text-purple-600">{completedCount}</span>
          <span className="text-3xl text-gray-400 mb-2">/ {totalCount} completed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-5 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p className="mt-4 text-2xl text-green-600 font-bold">🎉 Excellent work today!</p>
        )}
      </div>



      {/* Exercise List */}
      <div className="bg-white rounded-2xl shadow-lg p-8 border-l-8 border-blue-400">
        <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Heart className="w-9 h-9 text-pink-500" /> Today's Routine
        </h3>

        {/* Filter Tabs */}
        <div className="flex gap-3 flex-wrap mb-6">
          {(["all", "yoga", "exercise", "breathing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-6 py-3 rounded-full text-xl font-semibold transition-colors capitalize ${
                activeFilter === f
                  ? "bg-blue-500 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : categoryLabel[f]}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all ${
                ex.completed
                  ? "bg-green-50 border-green-300 opacity-80"
                  : "bg-gray-50 border-gray-200 hover:border-blue-200"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">{ex.icon}</span>
                <div>
                  <p className={`text-2xl font-bold ${ex.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {ex.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-lg px-3 py-1 rounded-full border font-medium ${categoryColors[ex.category]}`}>
                      {categoryLabel[ex.category]}
                    </span>
                    <span className="text-xl text-gray-500">{ex.duration}</span>
                    {ex.reps && <span className="text-xl text-gray-400">• {ex.reps}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => toggleExercise(ex.id)}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl text-xl font-bold transition-all ${
                  ex.completed
                    ? "bg-green-500 text-white"
                    : "bg-white border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {ex.completed
                  ? <><CheckCircle2 className="w-6 h-6" /> Done</>
                  : <><Play className="w-6 h-6" /> Start</>
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-2xl shadow-lg p-10">
        <h3 className="text-4xl font-bold mb-8">🌟 Session Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
            <p className="text-2xl opacity-90 mb-3">Exercises Done</p>
            <p className="text-6xl font-bold">{completedCount}/{totalCount}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8">
            <p className="text-2xl opacity-90 mb-3">Completion</p>
            <p className="text-6xl font-bold">{progressPct}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}