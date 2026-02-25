/**
 * utils/alertEngine.js
 * Caregiver alert logic — detects patterns and creates alerts.
 */

const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');

/**
 * Push a new alert into the store.
 */
function createAlert(userId, type, message) {
  const alert = {
    id:        uuidv4(),
    userId,
    timestamp: new Date().toISOString(),
    type,      // 'unwell_streak' | 'help_request' | 'inactivity' | 'missed_meds' | 'critical_symptom'
    message,
    resolved:  false,
  };
  store.alerts.push(alert);
  console.log(`🚨 ALERT [${type}] for ${userId}: ${message}`);
  return alert;
}

/**
 * Check last N check-ins for repeated discomfort.
 * If 2+ of last 3 are 'unwell' or 'help' → alert.
 */
function checkRepeatedDiscomfort(userId) {
  const userCheckIns = store.checkIns
    .filter(c => c.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 3);

  const badCount = userCheckIns.filter(c => c.status !== 'fine').length;

  if (badCount >= 2) {
    createAlert(
      userId,
      'unwell_streak',
      `User reported discomfort in ${badCount} of last 3 check-ins.`
    );
    return true;
  }
  return false;
}

/**
 * Check for inactivity: no interaction in last 6 hours.
 */
function checkInactivity(userId) {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const now = Date.now();

  const userInteractions = store.interactions
    .filter(i => i.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (userInteractions.length === 0) return true; // Never interacted

  const lastTime = new Date(userInteractions[0].timestamp).getTime();
  return (now - lastTime) > SIX_HOURS;
}

/**
 * Log a user interaction (called from controllers).
 */
function logInteraction(userId, type = 'api_call') {
  store.interactions.push({ userId, timestamp: new Date().toISOString(), type });
}

module.exports = { createAlert, checkRepeatedDiscomfort, checkInactivity, logInteraction };