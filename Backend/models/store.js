/**
 * In-Memory Data Store — Seva Saati
 * Acts as a database for the hackathon prototype.
 */

const { v4: uuidv4 } = require('uuid');

const store = {
  medicines: [],
  medicineLogs: [],
  checkins: [],
  symptoms: [],
  interactions: [],
  alerts: [],
};

const DEFAULT_USER = 'user_001';
const newId = () => uuidv4();
const now = () => new Date().toISOString();

// ── MEDICINES ─────────────────────────────────────────────────────────────────

const addMedicine = (data) => {
  const medicine = {
    id: newId(),
    userId: data.userId || DEFAULT_USER,
    name: data.name,
    dosage: data.dosage || '1 tablet',
    scheduledTime: data.scheduledTime,
    frequency: data.frequency || 'daily',
    active: true,
    createdAt: now(),
  };
  store.medicines.push(medicine);
  return medicine;
};

const getMedicines = (userId = DEFAULT_USER) =>
  store.medicines.filter((m) => m.userId === userId && m.active);

const getMedicineById = (id) => store.medicines.find((m) => m.id === id);

const logMedicineEvent = (medicineId, action, note = '') => {
  const log = {
    id: newId(),
    medicineId,
    action,
    note,
    timestamp: now(),
    date: new Date().toDateString(),
  };
  store.medicineLogs.push(log);
  return log;
};

const getMedicineLogs = (userId = DEFAULT_USER) => {
  const userMedIds = store.medicines
    .filter((m) => m.userId === userId)
    .map((m) => m.id);
  return store.medicineLogs.filter((l) => userMedIds.includes(l.medicineId));
};

// ── CHECK-INS ─────────────────────────────────────────────────────────────────

const addCheckin = (data) => {
  const checkin = {
    id: newId(),
    userId: data.userId || DEFAULT_USER,
    rawText: data.transcriptText,
    status: data.status,
    symptoms: data.symptoms || [],
    alertTriggered: data.alertTriggered || false,
    timestamp: now(),
    date: new Date().toDateString(),
    hour: new Date().getHours(),
  };
  store.checkins.push(checkin);
  return checkin;
};

const getCheckins = (userId = DEFAULT_USER) =>
  store.checkins.filter((c) => c.userId === userId);

// ── SYMPTOMS ──────────────────────────────────────────────────────────────────

const addSymptom = (data) => {
  const symptom = {
    id: newId(),
    userId: data.userId || DEFAULT_USER,
    rawText: data.transcriptText,
    keywords: data.keywords || [],
    severity: data.severity || 'mild',
    timestamp: now(),
  };
  store.symptoms.push(symptom);
  return symptom;
};

const getSymptoms = (userId = DEFAULT_USER) =>
  store.symptoms.filter((s) => s.userId === userId);

// ── INTERACTIONS ──────────────────────────────────────────────────────────────

const logInteraction = (userId = DEFAULT_USER) => {
  store.interactions.push({ userId, timestamp: now() });
};

const getLastInteraction = (userId = DEFAULT_USER) => {
  const events = store.interactions.filter((i) => i.userId === userId);
  return events.length ? events[events.length - 1] : null;
};

// ── ALERTS ────────────────────────────────────────────────────────────────────

const addAlert = (data) => {
  const alert = {
    id: newId(),
    userId: data.userId || DEFAULT_USER,
    type: data.type,
    message: data.message,
    severity: data.severity || 'medium',
    resolved: false,
    timestamp: now(),
  };
  store.alerts.push(alert);
  return alert;
};

const getAlerts = (userId = DEFAULT_USER) =>
  store.alerts.filter((a) => a.userId === userId && !a.resolved);

module.exports = {
  store,
  DEFAULT_USER,
  newId,
  now,
  addMedicine,
  getMedicines,
  getMedicineById,
  logMedicineEvent,
  getMedicineLogs,
  addCheckin,
  getCheckins,
  addSymptom,
  getSymptoms,
  logInteraction,
  getLastInteraction,
  addAlert,
  getAlerts,
};