/**
 * controllers/analysisController.js
 * Routine deviation detection, stability score, inactivity alert.
 */

const store = require('../models/store');
const { checkInactivity, createAlert } = require('../utils/alertEngine');

// ── GET /api/routine-analysis ─────────────────────────────────────────────────
exports.routineAnalysis = (req, res) => {
  const { userId = 'user_001' } = req.query;
  const deviations = [];

  // 1. Check-in time deviation (expected: before 10 AM)
  const todayStr    = new Date().toISOString().split('T')[0];
  const todayCheckin = store.checkIns.find(
    c => c.userId === userId && c.timestamp.startsWith(todayStr)
  );

  if (!todayCheckin) {
    deviations.push({ type: 'missed_checkin', message: 'No morning check-in recorded today.' });
  } else if (todayCheckin.hour > 10) {
    deviations.push({
      type:    'late_checkin',
      message: `Check-in was late — recorded at ${todayCheckin.hour}:00 (expected before 10:00).`,
    });
  }

  // 2. Medicine timing — any medicines not logged today
  const userMeds = store.medicines.filter(m => m.userId === userId);
  userMeds.forEach(med => {
    const takenToday = med.logs.some(l => l.date === todayStr && l.action === 'taken');
    const skippedToday = med.logs.some(l => l.date === todayStr && l.action === 'skipped');
    if (!takenToday && !skippedToday) {
      deviations.push({
        type:    'medicine_not_logged',
        message: `${med.name} (scheduled ${med.scheduleTime}) has no response recorded today.`,
      });
    }
  });

  // 3. Interaction frequency — count interactions in last 24h
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const recentInteractions = store.interactions.filter(
    i => i.userId === userId && new Date(i.timestamp).getTime() > oneDayAgo
  );

  const interactionCount = recentInteractions.length;
  if (interactionCount === 0) {
    deviations.push({ type: 'low_interaction', message: 'No app interactions in the last 24 hours.' });
  } else if (interactionCount < 3) {
    deviations.push({
      type:    'low_interaction',
      message: `Only ${interactionCount} interactions in last 24 hours — unusually low.`,
    });
  }

  res.json({
    userId,
    timestamp:      new Date().toISOString(),
    deviationsFound: deviations.length,
    deviations,
    summary:         deviations.length === 0
      ? 'Routine appears normal. No deviations detected.'
      : `${deviations.length} deviation(s) detected. Caregiver review recommended.`,
  });
};

// ── GET /api/stability-score ──────────────────────────────────────────────────
exports.stabilityScore = (req, res) => {
  const { userId = 'user_001' } = req.query;
  let score = 100;
  const breakdown = [];

  // Factor 1: Medicine adherence (40 pts)
  const meds = store.medicines.filter(m => m.userId === userId);
  if (meds.length > 0) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let taken = 0, total = 0;
    meds.forEach(med => {
      const recent = med.logs.filter(l => new Date(l.timestamp).getTime() > sevenDaysAgo);
      taken += recent.filter(l => l.action === 'taken').length;
      total += 7;
    });
    const adherencePct = total > 0 ? taken / total : 1;
    const adherenceScore = Math.round(adherencePct * 40);
    score = score - 40 + adherenceScore;
    breakdown.push({ factor: 'Medicine Adherence (7d)', score: adherenceScore, max: 40 });
  } else {
    breakdown.push({ factor: 'Medicine Adherence (7d)', score: 40, max: 40, note: 'No medicines' });
  }

  // Factor 2: Check-in status (35 pts)
  const last7CheckIns = store.checkIns
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 7);

  if (last7CheckIns.length > 0) {
    const fineCount   = last7CheckIns.filter(c => c.status === 'fine').length;
    const statusScore = Math.round((fineCount / last7CheckIns.length) * 35);
    score = score - 35 + statusScore;
    breakdown.push({ factor: 'Check-in Status (7d)', score: statusScore, max: 35 });
  } else {
    // No check-ins → deduct 15 pts
    score -= 15;
    breakdown.push({ factor: 'Check-in Status (7d)', score: 20, max: 35, note: 'No check-ins recorded' });
  }

  // Factor 3: Interaction frequency (25 pts)
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recentActivity = store.interactions.filter(
    i => i.userId === userId && new Date(i.timestamp).getTime() > threeDaysAgo
  ).length;
  const activityScore = Math.min(25, Math.round((recentActivity / 9) * 25)); // 9 interactions in 3d = full score
  score = score - 25 + activityScore;
  breakdown.push({ factor: 'App Activity (3d)', score: activityScore, max: 25 });

  score = Math.max(0, Math.min(100, score));

  let label, color;
  if (score >= 75)      { label = 'Stable';             color = 'green'; }
  else if (score >= 45) { label = 'Slightly Irregular'; color = 'orange'; }
  else                  { label = 'Needs Attention';    color = 'red'; }

  res.json({ userId, stabilityScore: score, label, color, breakdown });
};

// ── GET /api/inactivity-alert ─────────────────────────────────────────────────
exports.inactivityAlert = (req, res) => {
  const { userId = 'user_001' } = req.query;
  const inactive = checkInactivity(userId);

  if (inactive) {
    createAlert(userId, 'inactivity', 'No user activity detected in over 6 hours.');
  }

  const lastInteraction = store.interactions
    .filter(i => i.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

  res.json({
    userId,
    inactive,
    lastSeenAt:    lastInteraction ? lastInteraction.timestamp : null,
    alertTriggered: inactive,
    message:        inactive
      ? '⚠️ User has been inactive for more than 6 hours. Caregiver alert sent.'
      : '✅ User is active. No inactivity concern.',
  });
};