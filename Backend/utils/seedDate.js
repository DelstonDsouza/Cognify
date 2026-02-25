/**
 * utils/seedData.js
 * Pre-seeds the in-memory store with demo data so the app works on first launch.
 * Call this from server.js if SEED_DATA=true env var is set.
 */

const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');

function seed() {
  const userId = 'user_001';
  const today  = new Date().toISOString().split('T')[0];

  // Medicines
  store.medicines.push(
    { id: uuidv4(), userId, name: 'Metformin',   dosage: '500mg', scheduleTime: '08:00', createdAt: new Date().toISOString(), logs: [{ date: today, action: 'taken', timestamp: new Date().toISOString() }] },
    { id: uuidv4(), userId, name: 'Amlodipine',  dosage: '5mg',   scheduleTime: '09:00', createdAt: new Date().toISOString(), logs: [] },
    { id: uuidv4(), userId, name: 'Vitamin D3',  dosage: '1000IU',scheduleTime: '13:00', createdAt: new Date().toISOString(), logs: [{ date: today, action: 'skipped', timestamp: new Date().toISOString() }] }
  );

  // Check-ins
  store.checkIns.push(
    { id: uuidv4(), userId, timestamp: new Date().toISOString(), hour: 8, transcriptText: 'I am feeling okay today', status: 'fine',   alert: false },
  );

  // One past unwell check-in (yesterday)
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  store.checkIns.push(
    { id: uuidv4(), userId, timestamp: yesterday, hour: 9, transcriptText: 'Feeling a bit dizzy and tired', status: 'unwell', alert: true }
  );

  store.interactions.push({ userId, timestamp: new Date().toISOString(), type: 'seed' });

  console.log('🌱 Seed data loaded for user_001');
}

module.exports = seed;