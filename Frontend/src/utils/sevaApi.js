/**
 * frontend-integration/sevaApi.js
 * Drop this file into your React/Vite frontend at: src/utils/sevaApi.js
 *
 * This module handles ALL backend API calls and the Android WebView voice bridge.
 * Works in browser and inside Android WebView identically.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const DEFAULT_USER = 'user_001';

// ─────────────────────────────────────────────────────────────────────────────
// CORE FETCH HELPER
// ─────────────────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const res  = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'API Error');
  }
  return res.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// ANDROID WEBVIEW VOICE BRIDGE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speak text aloud via Android Native TTS.
 * Android exposes window.AndroidBridge.speak(text) via addJavascriptInterface().
 * Falls back to Web Speech API in browser.
 */
export function speak(text) {
  if (window.AndroidBridge && window.AndroidBridge.speak) {
    window.AndroidBridge.speak(text);         // ← Native Android TTS
  } else if ('speechSynthesis' in window) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang  = 'en-IN';
    utter.rate  = 0.85;
    window.speechSynthesis.speak(utter);      // ← Browser fallback
  }
}

/**
 * Start Android Native STT listening.
 * Android calls window.onSpeechResult(text) when done.
 * Returns a Promise that resolves with the transcript string.
 *
 * Usage:
 *   const transcript = await startListening();
 *   // send transcript to backend
 */
export function startListening() {
  return new Promise((resolve, reject) => {
    // Register callback for Android to call back into JS
    window.onSpeechResult = (transcript) => {
      window.onSpeechResult = null; // cleanup
      resolve(transcript);
    };

    window.onSpeechError = (error) => {
      window.onSpeechError = null;
      reject(new Error(error));
    };

    if (window.AndroidBridge && window.AndroidBridge.startListening) {
      window.AndroidBridge.startListening();  // ← Triggers Android STT
    } else {
      // Browser fallback using Web Speech API
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.lang        = 'en-IN';
      recognition.interimResults = false;
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror  = (e) => reject(e.error);
      recognition.start();
    }
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

  markTaken:   (id) => api(`/api/medicines/${id}/taken`,   { method: 'POST' }),
  markSkipped: (id) => api(`/api/medicines/${id}/skipped`, { method: 'POST' }),

  getAdherence: (userId = DEFAULT_USER) =>
    api(`/api/medicines/adherence?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// MORNING CHECK-IN (Voice Flow)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full morning check-in voice flow:
 * 1. Speak greeting
 * 2. Listen for user response
 * 3. Send transcript to backend
 * 4. Speak backend's TTS reply
 */
export async function runMorningCheckIn(userId = DEFAULT_USER) {
  speak('Good morning! How are you feeling today?');

  // Wait 2s for TTS to finish before listening
  await new Promise(r => setTimeout(r, 2000));

  const transcript = await startListening();
  const result     = await api('/api/morning-checkin', {
    method: 'POST',
    body:   JSON.stringify({ userId, transcriptText: transcript }),
  });

  // Speak the backend's suggested reply
  if (result.ttsReply) speak(result.ttsReply);

  return result; // { status, alert, checkIn }
}

// ─────────────────────────────────────────────────────────────────────────────
// VOICE MEDICATION CONFIRMATION (Voice Flow)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fires when a medicine reminder is due.
 * 1. Speak reminder
 * 2. Listen for user's response
 * 3. Send to backend
 * 4. Speak confirmation
 */
export async function runVoiceMedReminder(medicine, userId = DEFAULT_USER) {
  speak(`Time to take your ${medicine.name}, ${medicine.dosage}. Have you taken it?`);
  await new Promise(r => setTimeout(r, 2500));

  const transcript = await startListening();
  const result     = await api('/api/voice-medication-response', {
    method: 'POST',
    body:   JSON.stringify({ medicineId: medicine.id, transcriptText: transcript, userId }),
  });

  if (result.ttsReply) speak(result.ttsReply);
  return result; // { action, updatedLog }
}

// ─────────────────────────────────────────────────────────────────────────────
// SYMPTOM LOGGING
// ─────────────────────────────────────────────────────────────────────────────

export async function logSymptomByVoice(userId = DEFAULT_USER) {
  speak('Please describe how you are feeling. I am listening.');
  await new Promise(r => setTimeout(r, 2000));

  const transcript = await startListening();
  const result     = await api('/api/symptoms', {
    method: 'POST',
    body:   JSON.stringify({ userId, transcriptText: transcript }),
  });

  if (result.ttsReply) speak(result.ttsReply);
  return result;
}

export const Symptoms = {
  log:    (transcriptText, userId = DEFAULT_USER) =>
    api('/api/symptoms', { method: 'POST', body: JSON.stringify({ userId, transcriptText }) }),
  getAll: (userId = DEFAULT_USER) =>
    api(`/api/symptoms?userId=${userId}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS & DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const Analysis = {
  routineAnalysis: (userId = DEFAULT_USER) => api(`/api/routine-analysis?userId=${userId}`),
  stabilityScore:  (userId = DEFAULT_USER) => api(`/api/stability-score?userId=${userId}`),
  inactivityAlert: (userId = DEFAULT_USER) => api(`/api/inactivity-alert?userId=${userId}`),
};

export const Caregiver = {
  overview:     (userId = DEFAULT_USER) => api(`/api/caregiver/overview?userId=${userId}`),
  resolveAlert: (alertId)               => api(`/api/caregiver/alerts/${alertId}/resolve`, { method: 'POST' }),
};