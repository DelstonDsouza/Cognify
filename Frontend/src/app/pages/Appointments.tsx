import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, MapPin, User, Clock } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  title: string;
  doctor: string;
  location: string;
  date: string;
  time: string;
  notes: string;
}

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAppt, setNewAppt] = useState({
    title: "",
    doctor: "",
    location: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("appointments");
    if (stored) {
      setAppointments(JSON.parse(stored));
    }
  }, []);

  const saveAppointments = (appts: Appointment[]) => {
    localStorage.setItem("appointments", JSON.stringify(appts));
    setAppointments(appts);
  };

  const addAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.title || !newAppt.date || !newAppt.time) {
      toast.error("Please fill in required fields");
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      ...newAppt,
    };

    saveAppointments([...appointments, appointment]);
    setNewAppt({
      title: "",
      doctor: "",
      location: "",
      date: "",
      time: "",
      notes: "",
    });
    setShowAddForm(false);
    toast.success("Appointment added successfully!");
  };

  const deleteAppointment = (id: string) => {
    saveAppointments(appointments.filter((appt) => appt.id !== id));
    toast.success("Appointment removed");
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingAppointments = sortedAppointments.filter((appt) => {
    const apptDate = new Date(`${appt.date}T${appt.time}`);
    return apptDate > new Date();
  });

  const pastAppointments = sortedAppointments.filter((appt) => {
    const apptDate = new Date(`${appt.date}T${appt.time}`);
    return apptDate <= new Date();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Calendar className="w-10 h-10 text-blue-500" />
          My Appointments
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          Schedule Appointment
        </button>
      </div>

      {/* Add Appointment Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Schedule New Appointment
          </h3>
          <form onSubmit={addAppointment} className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Appointment Title *
              </label>
              <input
                type="text"
                value={newAppt.title}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, title: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Annual Check-up"
                required
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Doctor Name
              </label>
              <input
                type="text"
                value={newAppt.doctor}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, doctor: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., Dr. Smith"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={newAppt.location}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, location: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="e.g., City Medical Center"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={newAppt.date}
                  onChange={(e) =>
                    setNewAppt({ ...newAppt, date: e.target.value })
                  }
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  value={newAppt.time}
                  onChange={(e) =>
                    setNewAppt({ ...newAppt, time: e.target.value })
                  }
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={newAppt.notes}
                onChange={(e) =>
                  setNewAppt({ ...newAppt, notes: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Add Appointment
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg text-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Upcoming Appointments
        </h3>
        <div className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-500 mb-4">
                No upcoming appointments
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-semibold hover:bg-blue-600 transition-colors"
              >
                Schedule Your First Appointment
              </button>
            </div>
          ) : (
            upcomingAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">
                      {appt.title}
                    </h4>
                    <div className="space-y-2">
                      {appt.doctor && (
                        <p className="text-lg text-gray-600 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {appt.doctor}
                        </p>
                      )}
                      {appt.location && (
                        <p className="text-lg text-gray-600 flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {appt.location}
                        </p>
                      )}
                      <p className="text-lg text-gray-600 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {new Date(appt.date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-lg text-gray-600 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        {appt.time}
                      </p>
                      {appt.notes && (
                        <p className="text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAppointment(appt.id)}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Delete appointment"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Past Appointments
          </h3>
          <div className="space-y-4">
            {pastAppointments.map((appt) => (
              <div
                key={appt.id}
                className="bg-white rounded-xl shadow-lg p-6 opacity-70"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-800 mb-3">
                      {appt.title}
                    </h4>
                    <div className="space-y-2">
                      {appt.doctor && (
                        <p className="text-lg text-gray-600 flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {appt.doctor}
                        </p>
                      )}
                      <p className="text-lg text-gray-600 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        {new Date(appt.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAppointment(appt.id)}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Delete appointment"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
