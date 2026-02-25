import { Link } from "react-router";
import {
  Heart,
  Activity,
  Pill,
  Calendar,
  Phone,
  AlertCircle,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";

interface HealthData {
  date: string;
  bloodPressure: number;
  heartRate: number;
}

export function Dashboard() {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [upcomingMeds, setUpcomingMeds] = useState<any[]>([]);

  useEffect(() => {
    // Load mock data
    const mockHealthData = [
      { date: "Mon", bloodPressure: 120, heartRate: 72 },
      { date: "Tue", bloodPressure: 118, heartRate: 70 },
      { date: "Wed", bloodPressure: 122, heartRate: 74 },
      { date: "Thu", bloodPressure: 119, heartRate: 71 },
      { date: "Fri", bloodPressure: 121, heartRate: 73 },
      { date: "Sat", bloodPressure: 117, heartRate: 69 },
      { date: "Sun", bloodPressure: 120, heartRate: 72 },
    ];
    setHealthData(mockHealthData);

    // Load upcoming medications from localStorage
    const stored = localStorage.getItem("medications");
    if (stored) {
      const meds = JSON.parse(stored);
      const now = new Date();
      const upcoming = meds
        .filter((med: any) => {
          const [hours, minutes] = med.time.split(":");
          const medTime = new Date();
          medTime.setHours(parseInt(hours), parseInt(minutes), 0);
          return medTime > now;
        })
        .slice(0, 3);
      setUpcomingMeds(upcoming);
    }
  }, []);

  const quickActions = [
    {
      title: "Emergency SOS",
      icon: Phone,
      link: "/emergency",
      color: "bg-red-500 hover:bg-red-600",
      textColor: "text-white",
    },
    {
      title: "Log Health Data",
      icon: Activity,
      link: "/health",
      color: "bg-green-500 hover:bg-green-600",
      textColor: "text-white",
    },
    {
      title: "Take Medication",
      icon: Pill,
      link: "/medications",
      color: "bg-purple-500 hover:bg-purple-600",
      textColor: "text-white",
    },
    {
      title: "View Appointments",
      icon: Calendar,
      link: "/appointments",
      color: "bg-blue-500 hover:bg-blue-600",
      textColor: "text-white",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
          Welcome Back!
        </h2>
        <p className="text-xl text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              to={action.link}
              className={`${action.color} ${action.textColor} p-6 rounded-xl shadow-lg transition-transform hover:scale-105`}
            >
              <Icon className="w-10 h-10 mb-3" />
              <h3 className="text-xl font-semibold">{action.title}</h3>
            </Link>
          );
        })}
      </div>

      {/* Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Trends */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Heart className="w-7 h-7 text-red-500" />
            Weekly Health Trends
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={healthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" style={{ fontSize: "14px" }} />
              <YAxis style={{ fontSize: "14px" }} />
              <Tooltip
                contentStyle={{ fontSize: "16px", padding: "10px" }}
              />
              <Line
                type="monotone"
                dataKey="bloodPressure"
                stroke="#3b82f6"
                strokeWidth={3}
                name="Blood Pressure"
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                stroke="#ef4444"
                strokeWidth={3}
                name="Heart Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Medications */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Pill className="w-7 h-7 text-purple-500" />
            Upcoming Medications
          </h3>
          {upcomingMeds.length > 0 ? (
            <div className="space-y-3">
              {upcomingMeds.map((med, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-purple-50 rounded-lg"
                >
                  <div>
                    <p className="text-lg font-semibold text-gray-800">
                      {med.name}
                    </p>
                    <p className="text-gray-600">{med.dosage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-600">
                      {med.time}
                    </p>
                  </div>
                </div>
              ))}
              <Link
                to="/medications"
                className="block text-center text-blue-600 hover:text-blue-700 font-semibold text-lg mt-4"
              >
                View All Medications →
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-lg text-gray-500 mb-4">
                No medications scheduled
              </p>
              <Link
                to="/medications"
                className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors"
              >
                Add Medications
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white rounded-xl shadow-lg p-6">
        <h3 className="text-2xl font-bold mb-4">Today's Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Medications Taken</p>
            <p className="text-4xl font-bold">0/0</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Steps Today</p>
            <p className="text-4xl font-bold">0</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <p className="text-lg opacity-90">Water Intake</p>
            <p className="text-4xl font-bold">0 cups</p>
          </div>
        </div>
      </div>
    </div>
  );
}
