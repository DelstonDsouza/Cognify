// ── Types ─────────────────────────────────────────────────────────────────────

interface MedicineLog {
  date: string;
  action: 'taken' | 'skipped' | 'missed';
  timestamp: string;
}

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  scheduleTime: string;
  logs: MedicineLog[];
}

interface CheckIn {
  status: 'fine' | 'unwell' | 'help';
  timestamp: string;
  transcriptText?: string;
}

interface Symptom {
  id: string;
  timestamp: string;
  transcriptText: string;
  critical: boolean;
}

// ── Stability Score ───────────────────────────────────────────────────────────

export function computeStabilityScore(medicines: Medicine[] = [], checkIns: CheckIn[] = []) {
  let score = 100;
  const breakdown = [];

  // Factor 1: Medicine adherence — 40 points
  if (medicines.length > 0) {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let taken = 0, total = 0;

    medicines.forEach(med => {
      const recent = (med.logs || []).filter(
        l => new Date(l.timestamp).getTime() > sevenDaysAgo
      );
      taken += recent.filter(l => l.action === 'taken').length;
      total += 7;
    });

    const adherencePct   = total > 0 ? taken / total : 1;
    const adherenceScore = Math.round(adherencePct * 40);
    score = score - 40 + adherenceScore;
    breakdown.push({ factor: 'Medicine Adherence (7d)', score: adherenceScore, max: 40 });
  } else {
    breakdown.push({ factor: 'Medicine Adherence (7d)', score: 40, max: 40, note: 'No medicines' });
  }

  // Factor 2: Check-in wellness — 35 points
  const last7 = checkIns.slice(-7);
  if (last7.length > 0) {
    const fineCount   = last7.filter(c => c.status === 'fine').length;
    const statusScore = Math.round((fineCount / last7.length) * 35);
    score = score - 35 + statusScore;
    breakdown.push({ factor: 'Morning Check-ins (7d)', score: statusScore, max: 35 });
  } else {
    score -= 15;
    breakdown.push({ factor: 'Morning Check-ins (7d)', score: 20, max: 35, note: 'No check-ins yet' });
  }

  // Factor 3: Activity — 25 points
  const threeDaysAgo   = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recentCheckIns = checkIns.filter(
    c => new Date(c.timestamp).getTime() > threeDaysAgo
  ).length;
  const activityScore  = Math.min(25, Math.round((recentCheckIns / 3) * 25));
  score = score - 25 + activityScore;
  breakdown.push({ factor: 'Daily Activity (3d)', score: activityScore, max: 25 });

  score = Math.max(0, Math.min(100, score));

  let label: string, color: string;
  if (score >= 75)      { label = 'Stable';             color = '#22c55e'; }
  else if (score >= 45) { label = 'Slightly Irregular'; color = '#f97316'; }
  else                  { label = 'Needs Attention';    color = '#ef4444'; }

  return { score, label, color, breakdown };
}

// ── Routine Analysis ──────────────────────────────────────────────────────────

export function computeRoutineAnalysis(medicines: Medicine[] = [], checkIns: CheckIn[] = []) {
  const deviations: { type: string; severity: string; message: string }[] = [];
  const today = new Date().toISOString().split('T')[0];
  const now   = new Date();

  const todayCheckIn = checkIns.find(c => c.timestamp?.startsWith(today));

  if (!todayCheckIn) {
    deviations.push({ type: 'missed_checkin', severity: 'medium', message: 'No morning check-in recorded today.' });
  } else {
    const checkInHour = new Date(todayCheckIn.timestamp).getHours();
    if (checkInHour > 10) {
      deviations.push({ type: 'late_checkin', severity: 'low', message: `Check-in was late — done at ${checkInHour}:00 (expected before 10 AM).` });
    }
  }

  medicines.forEach(med => {
    const takenToday   = (med.logs || []).some(l => l.date === today && l.action === 'taken');
    const skippedToday = (med.logs || []).some(l => l.date === today && l.action === 'skipped');
    if (!takenToday && !skippedToday) {
      const scheduledHour = parseInt((med.scheduleTime || '08:00').split(':')[0]);
      if (now.getHours() > scheduledHour) {
        deviations.push({ type: 'missed_medicine', severity: 'high', message: `${med.name} (${med.scheduleTime}) — no response recorded today.` });
      }
    }
  });

  const last3    = checkIns.slice(-3);
  const badCount = last3.filter(c => c.status !== 'fine').length;
  if (badCount >= 2) {
    deviations.push({ type: 'repeated_discomfort', severity: 'high', message: `Reported discomfort in ${badCount} of the last 3 check-ins.` });
  }

  return {
    deviationsFound: deviations.length,
    deviations,
    summary: deviations.length === 0
      ? '✅ Routine looks normal. No issues detected.'
      : `⚠️ ${deviations.length} deviation(s) found. Review recommended.`,
  };
}

// ── Inactivity Detection ──────────────────────────────────────────────────────

export function computeInactivity(checkIns: CheckIn[] = []) {
  const SIX_HOURS = 6 * 60 * 60 * 1000;

  if (checkIns.length === 0) {
    return { inactive: true, lastSeenAt: null, hoursAgo: null, message: '⚠️ No activity recorded yet.' };
  }

  const sorted   = [...checkIns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const last     = sorted[0];
  const diff     = Date.now() - new Date(last.timestamp).getTime();
  const hoursAgo = Math.floor(diff / (60 * 60 * 1000));
  const inactive = diff > SIX_HOURS;

  return {
    inactive,
    lastSeenAt: last.timestamp,
    hoursAgo,
    message: inactive
      ? `⚠️ No activity for ${hoursAgo} hours. Caregiver should check in.`
      : `✅ Last active ${hoursAgo} hour(s) ago.`,
  };
}

// ── Caregiver Overview ────────────────────────────────────────────────────────

export function computeCaregiverOverview(
  medicines: Medicine[] = [],
  checkIns: CheckIn[]   = [],
  symptoms: Symptom[]   = []
) {
  const today = new Date().toISOString().split('T')[0];

  const sorted      = [...checkIns].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const lastCheckIn = sorted[0] || null;
  const statusSummary = lastCheckIn
    ? { status: lastCheckIn.status, at: lastCheckIn.timestamp, transcript: lastCheckIn.transcriptText }
    : { status: 'unknown', at: null, transcript: null };

  const missedMedicines = medicines.filter(med => {
    const takenToday   = (med.logs || []).some(l => l.date === today && l.action === 'taken');
    const skippedToday = (med.logs || []).some(l => l.date === today && l.action === 'skipped');
    return !takenToday && !skippedToday;
  }).map(m => ({ id: m.id, name: m.name, scheduleTime: m.scheduleTime }));

  const alerts: { type: string; message: string; severity: string }[] = [];

  if (lastCheckIn?.status === 'help') {
    alerts.push({ type: 'help_request', message: 'User requested help in last check-in.', severity: 'critical' });
  }
  const last3    = checkIns.slice(-3);
  const badCount = last3.filter(c => c.status !== 'fine').length;
  if (badCount >= 2) {
    alerts.push({ type: 'unwell_streak', message: `Felt unwell ${badCount}/3 recent check-ins.`, severity: 'high' });
  }
  if (missedMedicines.length > 0) {
    alerts.push({ type: 'missed_meds', message: `${missedMedicines.length} medicine(s) not taken today.`, severity: 'medium' });
  }
  const criticalSymptoms = symptoms.filter(s => s.critical);
  if (criticalSymptoms.length > 0) {
    alerts.push({ type: 'critical_symptom', message: `${criticalSymptoms.length} critical symptom(s) logged.`, severity: 'critical' });
  }

  const inactivity = computeInactivity(checkIns);
  if (inactivity.inactive) {
    alerts.push({ type: 'inactivity', message: inactivity.message, severity: 'high' });
  }

  const stability = computeStabilityScore(medicines, checkIns);
  const routine   = computeRoutineAnalysis(medicines, checkIns);

  return {
    generatedAt:       new Date().toISOString(),
    statusSummary,
    missedMedicines,
    alerts,
    routineDeviations: routine.deviations,
    stabilityScore:    stability.label,
    stabilityNumber:   stability.score,
    stabilityColor:    stability.color,
    inactivity,
    recentSymptoms:    [...symptoms].reverse().slice(0, 5),
    totalAlerts:       alerts.length,
  };
}