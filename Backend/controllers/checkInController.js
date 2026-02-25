/**
 * controllers/checkInController.js
 * Morning check-in and voice medication response handlers.
 */

const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');
const { classifyCheckIn, classifyMedResponse } = require('../utils/voiceParser');
const { createAlert, checkRepeatedDiscomfort, logInteraction } = require('../utils/alertEngine');

// ── POST /api/morning-checkin ─────────────────────────────────────────────────
exports.morningCheckIn = (req, res) => {
  const { userId = 'user_001', transcriptText } = req.body;

  if (!transcriptText) {
    return res.status(400).json({ error: 'transcriptText is required' });
  }

  const status = classifyCheckIn(transcriptText);
  const now    = new Date();

  const checkIn = {
    id:             uuidv4(),
    userId,
    timestamp:      now.toISOString(),
    hour:           now.getHours(),
    transcriptText,
    status,
    alert:          false,
  };

  // Immediate alert for help request
  if (status === 'help') {
    createAlert(userId, 'help_request', `User urgently requested help: "${transcriptText.slice(0, 80)}"`);
    checkIn.alert = true;
  }

  store.checkIns.push(checkIn);
  logInteraction(userId, 'morning_checkin');

  // Check for repeated discomfort pattern (unwell 2+ times in last 3 check-ins)
  if (status !== 'fine') {
    const triggered = checkRepeatedDiscomfort(userId);
    if (triggered) checkIn.alert = true;
  }

  // Build TTS reply for Android to speak back
  const ttsReply = buildTTSReply(status, now.getHours());

  res.json({
    success:  true,
    status,
    alert:    checkIn.alert,
    ttsReply, // Android reads this aloud after API responds
    checkIn,
  });
};

function buildTTSReply(status, hour) {
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (status === 'fine')   return `${greeting}! Glad you are feeling well. Have a wonderful day.`;
  if (status === 'help')   return `I am alerting your caregiver right away. Please stay calm. Help is on the way.`;
  return `${greeting}. I am sorry you are not feeling well. I have noted this and informed your caregiver. Please rest and take your medicines on time.`;
}

// ── POST /api/voice-medication-response ──────────────────────────────────────
exports.voiceMedResponse = (req, res) => {
  const { medicineId, transcriptText, userId = 'user_001' } = req.body;

  if (!medicineId || !transcriptText) {
    return res.status(400).json({ error: 'medicineId and transcriptText are required' });
  }

  const med = store.medicines.find(m => m.id === medicineId);
  if (!med) return res.status(404).json({ error: 'Medicine not found' });

  const action = classifyMedResponse(transcriptText);
  const today  = new Date().toISOString().split('T')[0];

  // Remove any existing log for today first (avoid duplicates on re-confirmation)
  med.logs = med.logs.filter(l => l.date !== today);
  med.logs.push({ date: today, action, timestamp: new Date().toISOString() });

  logInteraction(userId, `medicine_voice_${action}`);

  // Build TTS confirmation
  const ttsReplies = {
    taken:   `Great! I have recorded that you took ${med.name}. Well done!`,
    later:   `Okay, I will remind you again in 30 minutes to take ${med.name}.`,
    skipped: `Understood. I have noted that you skipped ${med.name} today. Your caregiver has been informed.`,
  };

  if (action === 'skipped') {
    createAlert(userId, 'missed_meds', `${med.name} was intentionally skipped by user.`);
  }

  res.json({
    success:    true,
    action,
    updatedLog: true,
    ttsReply:   ttsReplies[action],
    medicine:   med,
  });
};