/**
 * caregiverController.js
 * Caregiver Dashboard Data API
 */

const store = require("../models/store");
const { createAlert, updateActivity } = require("../utils/alertEngine");

// GET /api/caregiver/overview
const getCaregiverOverview = (req, res) => {
  const { userId = "user1" } = req.query;
  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // --- Today's Status ---
  const todayCheckins = store.morningCheckins
    .filter(c => c.userId === userId && new Date(c.timestamp).toDateString() === todayStr)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const latestStatus = todayCheckins[0]?.status || "no_checkin";

  // --- Missed Medicines Today ---
  const activeMeds = store.medicines.filter(m => m.userId === userId && m.active);
  const todayMedLogs = store.medicineLogs.filter(
    l => l.userId === userId && new Date(l.timestamp).toDateString() === todayStr
  );

  const missedMeds = activeMeds.filter(med => {
    const log = todayMedLogs.find(l => l.medicineId === med.id);
    return !log || log.action === "skipped";
  });

  // --- Recent Alerts (last 7 days) ---
  const recentAlerts = store.alerts
    .filter(a => a.userId === userId && new Date(a.timestamp) >= weekAgo)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  // --- Unread Alert Count ---
  const unreadAlerts = store.alerts.filter(a => a.userId === userId && !a.read).length;

  // --- Routine Deviation Summary ---
  const routineAlerts = recentAlerts.filter(a => a.type === "routine_deviation");

  // --- Stability Score ---
  const weeklyLogs = store.medicineLogs.filter(
    l => l.userId === userId && new Date(l.timestamp) >= weekAgo
  );
  const takenCount = weeklyLogs.filter(l => l.action === "taken").length;
  const skippedCount = weeklyLogs.filter(l => l.action === "skipped").length;
  const totalExpected = activeMeds.length * 7;
  const adherence = totalExpected > 0 ? Math.round((takenCount / totalExpected) * 100) : 100;

  const recentUnwells = store.morningCheckins.filter(
    c => c.userId === userId && c.status !== "fine" && new Date(c.timestamp) >= weekAgo
  ).length;

  const inactive = isInactive(userId, 6);

  let stabilityScore = "Stable";
  if (inactive || adherence < 60 || recentUnwells >= 3) {
    stabilityScore = "Needs Attention";
  } else if (adherence < 80 || recentUnwells >= 2) {
    stabilityScore = "Slightly Irregular";
  }

  // --- 7-day trend (simple: status per day) ---
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now - i * 24 * 60 * 60 * 1000);
    const dayStr = day.toDateString();
    const dayCheckins = store.morningCheckins.filter(
      c => c.userId === userId && new Date(c.timestamp).toDateString() === dayStr
    );
    const dayMedLogs = store.medicineLogs.filter(
      l => l.userId === userId && new Date(l.timestamp).toDateString() === dayStr
    );
    trend.push({
      date: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
      status: dayCheckins[0]?.status || "no_data",
      medicinesTaken: dayMedLogs.filter(l => l.action === "taken").length,
      medicinesSkipped: dayMedLogs.filter(l => l.action === "skipped").length,
    });
  }

  return res.json({
    userId,
    overview: {
      todayStatus: latestStatus,
      lastCheckinTime: todayCheckins[0]?.timestamp || null,
      inactive,
    },
    missedMedicines: missedMeds.map(m => ({ id: m.id, name: m.name, scheduledTime: m.time })),
    alerts: recentAlerts,
    unreadAlertCount: unreadAlerts,
    routineDeviations: routineAlerts.length,
    stabilityScore,
    adherenceScore: adherence,
    weeklyTrend: trend,
  });
};

// GET /api/stability-score
const getStabilityScore = (req, res) => {
  const { userId = "user1" } = req.query;
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const activeMeds = store.medicines.filter(m => m.userId === userId && m.active);
  const weeklyLogs = store.medicineLogs.filter(
    l => l.userId === userId && new Date(l.timestamp) >= weekAgo
  );

  const takenCount = weeklyLogs.filter(l => l.action === "taken").length;
  const totalExpected = activeMeds.length * 7;
  const adherence = totalExpected > 0 ? Math.round((takenCount / totalExpected) * 100) : 100;

  const recentUnwells = store.morningCheckins.filter(
    c => c.userId === userId && c.status !== "fine" && new Date(c.timestamp) >= weekAgo
  ).length;

  const inactive = isInactive(userId, 6);

  let score = "Stable";
  let color = "green";
  let message = "Routine is consistent. Medications are on track.";

  if (inactive || adherence < 60 || recentUnwells >= 3) {
    score = "Needs Attention";
    color = "red";
    message = "Significant deviations detected. Please check on the patient.";
  } else if (adherence < 80 || recentUnwells >= 2) {
    score = "Slightly Irregular";
    color = "orange";
    message = "Minor deviations detected. Keep monitoring.";
  }

  return res.json({
    userId,
    stabilityScore: score,
    color,
    message,
    factors: {
      medicineAdherence: `${adherence}%`,
      recentUnwellReports: recentUnwells,
      currentlyInactive: inactive,
    },
  });
};

// PATCH /api/caregiver/alerts/:id/read
const markAlertRead = (req, res) => {
  const { id } = req.params;
  const alert = store.alerts.find(a => a.id === id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  alert.read = true;
  return res.json({ success: true });
};

module.exports = { getCaregiverOverview, getStabilityScore, markAlertRead };