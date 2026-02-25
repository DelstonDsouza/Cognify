import { useState, useEffect } from "react";
import { Heart, Plus, Check, Sun, Moon, Coffee, Footprints } from "lucide-react";
import { toast } from "sonner";

interface Activity {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  date: string;
}

interface DailyGoal {
  name: string;
  icon: string;
  target: number;
  current: number;
  unit: string;
}

export function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([
    { name: "Steps", icon: "Footprints", target: 5000, current: 0, unit: "steps" },
    { name: "Water", icon: "Coffee", target: 8, current: 0, unit: "cups" },
    { name: "Exercise", icon: "Heart", target: 30, current: 0, unit: "minutes" },
  ]);

  const suggestedActivities = [
    { name: "Morning Walk", icon: "Sun" },
    { name: "Medication Check", icon: "Pill" },
    { name: "Breakfast", icon: "Coffee" },
    { name: "Light Exercise", icon: "Heart" },
    { name: "Reading Time", icon: "Book" },
    { name: "Social Call", icon: "Phone" },
    { name: "Afternoon Rest", icon: "Moon" },
    { name: "Evening Walk", icon: "Footprints" },
  ];

  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("activities");
    if (stored) {
      const allActivities = JSON.parse(stored);
      // Filter activities for today
      const todayActivities = allActivities.filter(
        (act: Activity) => new Date(act.date).toDateString() === today
      );
      setActivities(todayActivities);
    }

    const storedGoals = localStorage.getItem("dailyGoals");
    if (storedGoals) {
      setDailyGoals(JSON.parse(storedGoals));
    }
  }, []);

  const saveActivities = (newActivities: Activity[]) => {
    localStorage.setItem("activities", JSON.stringify(newActivities));
    setActivities(newActivities);
  };

  const saveDailyGoals = (goals: DailyGoal[]) => {
    localStorage.setItem("dailyGoals", JSON.stringify(goals));
    setDailyGoals(goals);
  };

  const addActivity = (name: string, icon: string) => {
    const activity: Activity = {
      id: Date.now().toString(),
      name,
      icon,
      completed: false,
      date: new Date().toISOString(),
    };

    const stored = localStorage.getItem("activities");
    const allActivities = stored ? JSON.parse(stored) : [];
    const updated = [...allActivities, activity];
    
    localStorage.setItem("activities", JSON.stringify(updated));
    setActivities([...activities, activity]);
    toast.success(`Added "${name}" to your activities`);
  };

  const toggleActivity = (id: string) => {
    const stored = localStorage.getItem("activities");
    const allActivities = stored ? JSON.parse(stored) : [];
    
    const updated = allActivities.map((act: Activity) =>
      act.id === id ? { ...act, completed: !act.completed } : act
    );
    
    localStorage.setItem("activities", JSON.stringify(updated));
    
    const todayActivities = updated.filter(
      (act: Activity) => new Date(act.date).toDateString() === new Date().toDateString()
    );
    setActivities(todayActivities);
    
    const activity = updated.find((a: Activity) => a.id === id);
    if (activity?.completed) {
      toast.success(`Completed: ${activity.name}`);
    }
  };

  const updateGoalProgress = (goalName: string, increment: number) => {
    const updated = dailyGoals.map((goal) =>
      goal.name === goalName
        ? {
            ...goal,
            current: Math.max(0, Math.min(goal.current + increment, goal.target)),
          }
        : goal
    );
    saveDailyGoals(updated);
    if (increment > 0) {
      toast.success(`Added ${increment} ${goalName.toLowerCase()}`);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: { [key: string]: any } = {
      Sun,
      Moon,
      Coffee,
      Heart,
      Footprints,
    };
    return icons[iconName] || Heart;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Heart className="w-10 h-10 text-pink-500" />
          Daily Activities & Well-being
        </h2>
        <p className="text-xl text-gray-600 mt-2">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Daily Goals */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Daily Goals</h3>
        <div className="space-y-4">
          {dailyGoals.map((goal) => {
            const Icon = getIconComponent(goal.icon);
            const percentage = (goal.current / goal.target) * 100;

            return (
              <div key={goal.name}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-6 h-6 text-blue-500" />
                    <span className="text-lg font-semibold text-gray-800">
                      {goal.name}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-gray-600">
                    {goal.current} / {goal.target} {goal.unit}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateGoalProgress(goal.name, -1)}
                      className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-bold text-lg"
                      disabled={goal.current === 0}
                    >
                      −
                    </button>
                    <button
                      onClick={() => updateGoalProgress(goal.name, 1)}
                      className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg"
                      disabled={goal.current >= goal.target}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Today's Activities
        </h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-lg text-gray-500 text-center py-8">
              No activities added yet. Add some from the suggestions below!
            </p>
          ) : (
            activities.map((activity) => {
              const Icon = getIconComponent(activity.icon);
              return (
                <div
                  key={activity.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    activity.completed
                      ? "bg-green-50 border-2 border-green-500"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-6 h-6 ${
                        activity.completed ? "text-green-500" : "text-gray-500"
                      }`}
                    />
                    <span
                      className={`text-lg font-semibold ${
                        activity.completed
                          ? "text-green-700 line-through"
                          : "text-gray-800"
                      }`}
                    >
                      {activity.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleActivity(activity.id)}
                    className={`px-4 py-2 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2 ${
                      activity.completed
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    {activity.completed ? "Done" : "Complete"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Suggested Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-7 h-7 text-blue-500" />
          Add Activity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {suggestedActivities.map((activity) => {
            const Icon = getIconComponent(activity.icon);
            return (
              <button
                key={activity.name}
                onClick={() => addActivity(activity.name, activity.icon)}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all text-left border-2 border-transparent hover:border-blue-500"
              >
                <Icon className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-semibold text-gray-800">
                  {activity.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Well-being Tips */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-4">💝 Well-being Tips</h3>
        <ul className="space-y-2 text-lg">
          <li>✨ Stay hydrated throughout the day</li>
          <li>✨ Take regular breaks and move around</li>
          <li>✨ Maintain social connections with loved ones</li>
          <li>✨ Get adequate sleep (7-8 hours)</li>
          <li>✨ Practice mindfulness or meditation</li>
          <li>✨ Spend time in nature when possible</li>
        </ul>
      </div>
    </div>
  );
}
