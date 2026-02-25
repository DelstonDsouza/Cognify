import { useState, useEffect } from "react";
import { Pill, Plus, Trash2, Clock, Check } from "lucide-react";
import { toast } from "sonner";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  time: string;
  frequency: string;
  taken: boolean;
}

export function Medications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: "",
    dosage: "",
    time: "",
    frequency: "daily",
  });

  useEffect(() => {
    const stored = localStorage.getItem("medications");
    if (stored) {
      setMedications(JSON.parse(stored));
    }
  }, []);

  const saveMedications = (meds: Medication[]) => {
    localStorage.setItem("medications", JSON.stringify(meds));
    setMedications(meds);
  };

  const addMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name || !newMed.dosage || !newMed.time) {
      toast.error("Please fill in all fields");
      return;
    }

    const medication: Medication = {
      id: Date.now().toString(),
      ...newMed,
      taken: false,
    };

    saveMedications([...medications, medication]);
    setNewMed({ name: "", dosage: "", time: "", frequency: "daily" });
    setShowAddForm(false);
    toast.success("Medication added successfully!");
  };

  const deleteMedication = (id: string) => {
    saveMedications(medications.filter((med) => med.id !== id));
    toast.success("Medication removed");
  };

  const toggleTaken = (id: string) => {
    const updated = medications.map((med) =>
      med.id === id ? { ...med, taken: !med.taken } : med
    );
    saveMedications(updated);
    const med = updated.find((m) => m.id === id);
    if (med?.taken) {
      toast.success(`Marked ${med.name} as taken`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 flex items-center gap-3">
          <Pill className="w-10 h-10 text-purple-500" />
          My Medications
        </h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-6 h-6" />
          Add Medication
        </button>
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Add New Medication
          </h3>
          <form onSubmit={addMedication} className="space-y-4">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Medication Name
              </label>
              <input
                type="text"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="e.g., Aspirin"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Dosage
              </label>
              <input
                type="text"
                value={newMed.dosage}
                onChange={(e) =>
                  setNewMed({ ...newMed, dosage: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                placeholder="e.g., 100mg"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={newMed.time}
                onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={newMed.frequency}
                onChange={(e) =>
                  setNewMed({ ...newMed, frequency: e.target.value })
                }
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="twice-daily">Twice Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as-needed">As Needed</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors"
              >
                Add Medication
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

      {/* Medications List */}
      <div className="space-y-4">
        {medications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Pill className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-4">
              No medications added yet
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg text-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              Add Your First Medication
            </button>
          </div>
        ) : (
          medications.map((med) => (
            <div
              key={med.id}
              className={`bg-white rounded-xl shadow-lg p-6 transition-all ${
                med.taken ? "opacity-60" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {med.name}
                  </h3>
                  <div className="space-y-1">
                    <p className="text-lg text-gray-600">
                      <span className="font-semibold">Dosage:</span> {med.dosage}
                    </p>
                    <p className="text-lg text-gray-600 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span className="font-semibold">Time:</span> {med.time}
                    </p>
                    <p className="text-lg text-gray-600">
                      <span className="font-semibold">Frequency:</span>{" "}
                      {med.frequency}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleTaken(med.id)}
                    className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors flex items-center gap-2 ${
                      med.taken
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    <Check className="w-6 h-6" />
                    {med.taken ? "Taken" : "Mark as Taken"}
                  </button>
                  <button
                    onClick={() => deleteMedication(med.id)}
                    className="px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    aria-label="Delete medication"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
