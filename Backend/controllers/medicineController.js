const {
  addMedicine,
  getMedicines,
  getMedicineById,
  logMedicineEvent,
} = require("../models/store");

// ADD MEDICINE
const createMedicine = (req, res) => {
  const { name, scheduledTime, dosage } = req.body;

  if (!name || !scheduledTime) {
    return res.status(400).json({ error: "name and scheduledTime required" });
  }

  const medicine = addMedicine({
    name,
    scheduledTime,
    dosage,
  });

  res.json({ success: true, medicine });
};

// GET ALL MEDICINES
const fetchMedicines = (req, res) => {
  const medicines = getMedicines();
  res.json({ medicines });
};

// MARK TAKEN
const markTaken = (req, res) => {
  const { id } = req.params;

  const med = getMedicineById(id);
  if (!med) return res.status(404).json({ error: "Medicine not found" });

  const log = logMedicineEvent(id, "taken");

  res.json({ success: true, log });
};

// MARK SKIPPED
const markSkipped = (req, res) => {
  const { id } = req.params;

  const med = getMedicineById(id);
  if (!med) return res.status(404).json({ error: "Medicine not found" });

  const log = logMedicineEvent(id, "skipped");

  res.json({ success: true, log });
};

// ADHERENCE PLACEHOLDER
const getAdherence = (req, res) => {
  res.json({ message: "Adherence logic coming next" });
};

module.exports = {
  addMedicine: createMedicine,
  getMedicines: fetchMedicines,
  markTaken,
  markSkipped,
  getAdherence,
};