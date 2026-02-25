/**
 * symptomController.js
 * Logs voice-narrated symptoms from elderly user
 */

const store = require("../models/store");
const { v4: uuidv4 } = require("uuid");
const { isCriticalSymptom } = require("../utils/voiceParser");
const { createAlert, updateActivity } = require("../utils/alertEngine");

// POST /api/symptoms
const logSymptom = (req, res) => {
  const { userId = "user1", transcriptText } = req.body;

  if (!transcriptText) {
    return res.status(400).json({ error: "transcriptText is required" });
  }

  const urgent = isUrgentSymptom(transcriptText);

  const symptom = {
    id: uuidv4(),
    userId,
    transcript: transcriptText,
    urgent,
    timestamp: new Date().toISOString(),
  };

  store.symptoms.push(symptom);
  updateActivity(userId);

  let alert = null;
  let ttsResponse = "";

  if (urgent) {
    alert = createAlert(
      userId,
      "urgent_symptom",
      `🆘 Urgent symptom reported by ${userId}: "${transcriptText}"`
    );
    ttsResponse = "I heard that you are experiencing a serious symptom. I have alerted your caregiver immediately. Please stay calm and do not move if you have fallen.";
  } else {
    ttsResponse = "Thank you for telling me how you feel. I have recorded your symptoms and shared them with your caregiver.";
  }

  return res.json({
    success: true,
    symptomId: symptom.id,
    urgent,
    alertSent: !!alert,
    ttsResponse,
  });
};

// GET /api/symptoms
const getSymptoms = (req, res) => {
  const { userId = "user1" } = req.query;
  const userSymptoms = store.symptoms
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return res.json({ symptoms: userSymptoms });
};

module.exports = { logSymptom, getSymptoms };