/**
 * src/utils/sevaApi.js
 * Central API + voice bridge for Seva Saati frontend.
 * Works in browser (Web Speech API) and Android WebView (AndroidBridge).
 */

const BASE_URL     = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_USER = 'user_001';

// ─────────────────────────────────────────────────────────────────────────────
// CORE FETCH HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error(`[sevaApi] ${path} failed:`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE — TTS (Text-to-Speech)
// ─────────────────────────────────────────────────────────────────────────────

export function speak(text) {
  if (!text) return;
  if (window.AndroidBridge?.speak) {
    window.AndroidBridge.speak(text);
    return;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // stop any current speech first
    const utter  = new SpeechSynthesisUtterance(text);
    utter.lang   = 'en-IN';
    utter.rate   = 0.88;
    utter.pitch  = 1;
    window.speechSynthesis.speak(utter);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE — STT (Speech-to-Text)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a Promise<string> with the transcript.
 * Works in Android WebView (AndroidBridge) and browser (webkitSpeechRecognition).
 */
export function startListening() {
  return new Promise((resolve, reject) => {
    // ── Android WebView path ──
    if (window.AndroidBridge?.startVoiceInput) {
      // AndroidBridge.kt sends results via window.onAndroidEvent
      const handler = (event, data) => {
        if (event === 'onSpeechResult') {
          window.onAndroidEvent = null;
          resolve(data);
        } else if (event === 'onSpeechError') {
          window.onAndroidEvent = null;
          reject(new Error(data));
        }
      };
      window.onAndroidEvent = handler;
      window.AndroidBridge.startVoiceInput();
      return;
    }

    // ── Browser Web Speech API fallback ──
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      reject(new Error('Speech recognition not supported in this browser'));
      return;
    }

    const recognition          = new SR();
    recognition.lang           = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => resolve(e.results[0][0].transcript);
    recognition.onerror  = (e) => reject(new Error(e.error));
    recognition.onend    = () => {};  // keep promise open until result/error fires
    recognition.start();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MEDICINE APIs
// ─────────────────────────────────────────────────────────────────────────────

export const Medicines = {
  getAll: (userId = DEFAULT_USER) =>
    api(`/api/medicines?userId=${userId}`),

  add: (name, dosage, scheduleTime, userId = DEFAULT_USER) =>
    api('/api/medicines', {
      method: 'POST',
      body:   JSON.stringify({ userId, name, dosage, scheduleTime }),
    }),

  markTaken:   (id, userId = DEFAULT_USER) =>
    api(`/api/medicines/${id}/taken`,   { method: 'POST', body: JSON.stringify({ userId }) }),

  markSkipped: (id, userId = DEFAULT_USER) =>
    api(`/api/medicines/${id}/skipped`, { method: 'POST', body: JSON.stringify({ userId }) }),

  getAdherence: (userId = DEFAULT_USER) =>
    api(`/api/medicines/adherence?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN APIs
// ─────────────────────────────────────────────────────────────────────────────

export const CheckIn = {
  // FIX: sevaApi was calling /api/morning-checkin — alias added in server.js too
  morning: (transcriptText, userId = DEFAULT_USER) =>
    api('/api/morning-checkin', {
      method: 'POST',
      body:   JSON.stringify({ userId, transcriptText }),
    }),

  medicationResponse: (medicineId, transcriptText, userId = DEFAULT_USER) =>
    api('/api/checkin/medication-response', {
      method: 'POST',
      body:   JSON.stringify({ medicineId, transcriptText, userId }),
    }),

  getAll: (userId = DEFAULT_USER) =>
    api(`/api/checkin?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM APIs
// ─────────────────────────────────────────────────────────────────────────────

export const Symptoms = {
  log: (transcriptText, userId = DEFAULT_USER) =>
    api('/api/symptoms', {
      method: 'POST',
      body:   JSON.stringify({ userId, transcriptText }),
    }),

  getAll: (userId = DEFAULT_USER) =>
    api(`/api/symptoms?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// CAREGIVER / ANALYSIS APIs
// ─────────────────────────────────────────────────────────────────────────────

export const Caregiver = {
  overview:       (userId = DEFAULT_USER) => api(`/api/caregiver/overview?userId=${userId}`),
  stabilityScore: (userId = DEFAULT_USER) => api(`/api/caregiver/stability-score?userId=${userId}`),
  resolveAlert:   (alertId)               => api(`/api/caregiver/alerts/${alertId}/read`, { method: 'PATCH' }),
};

export const Analysis = {
  routine:    (userId = DEFAULT_USER) => api(`/api/routine-analysis?userId=${userId}`),
  inactivity: (userId = DEFAULT_USER) => api(`/api/inactivity-alert?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// VOICE FLOWS (complete end-to-end flows used by UI components)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full morning check-in voice flow.
 * Call this from the Dashboard "Voice Check-In" button.
 */
export async function runMorningCheckIn(userId = DEFAULT_USER) {
  speak('Good morning! How are you feeling today?');
  await delay(2200);

  let transcript;
  try {
    transcript = await startListening();
  } catch {
    return null; // mic error — caller should show fallback UI
  }

  const result = await CheckIn.morning(transcript, userId);
  if (result?.ttsReply) speak(result.ttsReply);
  return result; // { status, alert, ttsReply, checkIn }
}

/**
 * Voice medication reminder flow.
 * Call when a medicine reminder fires.
 */
export async function runVoiceMedReminder(medicine, userId = DEFAULT_USER) {
  speak(`Time to take your ${medicine.name}, ${medicine.dosage}. Have you taken it?`);
  await delay(2500);

  let transcript;
  try {
    transcript = await startListening();
  } catch {
    return null;
  }

  const result = await CheckIn.medicationResponse(medicine.id, transcript, userId);
  if (result?.ttsReply) speak(result.ttsReply);
  return result; // { action, ttsReply }
}

/**
 * Voice symptom logging flow.
 * Call from the HealthVitals "Voice Symptom" button.
 */
export async function runVoiceSymptomLog(userId = DEFAULT_USER) {
  speak('Please describe how you are feeling. I am listening.');
  await delay(2000);

  let transcript;
  try {
    transcript = await startListening();
  } catch {
    return null;
  }

  const result = await Symptoms.log(transcript, userId);
  if (result?.ttsReply) speak(result.ttsReply);
  return result; // { critical, symptom, ttsReply }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export { DEFAULT_USER };
