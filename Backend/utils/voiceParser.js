/**
 * utils/voiceParser.js
 * Keyword-based voice transcript classification.
 * No ML dependency — pure string matching for hackathon speed.
 */

// ── Morning Check-In Keywords ─────────────────────────────────────────────────

const FINE_WORDS = [
  'fine','good','great','okay','ok','well','better','normal',
  'perfect','happy','healthy','fit','alright','nice','wonderful',
  'excellent','superb','feeling good','all good','no problem',
  'thik','theek','acha','accha','badhiya', // Hindi transliterations
];

const UNWELL_WORDS = [
  'pain','ache','tired','fatigue','dizzy','nausea','sick','unwell',
  'headache','fever','cold','cough','weak','vomit','breathless',
  'chest','back pain','not good','not well','feeling bad','bad',
  'hurt','hurts','suffering','ill','uncomfortable','restless',
  'dard','takleef','bukhar','sir dard', // Hindi transliterations
];

const HELP_WORDS = [
  'help','emergency','urgent','doctor','hospital','ambulance',
  'serious','critical','please help','need help','call','fall',
  'fell','fallen','accident','bleeding','unconscious','madad',
];

/**
 * Classify a morning check-in transcript.
 * Returns: 'fine' | 'unwell' | 'help'
 */
function classifyCheckIn(text) {
  if (!text) return 'unwell';
  const lower = text.toLowerCase();

  if (HELP_WORDS.some(w => lower.includes(w)))   return 'help';
  if (UNWELL_WORDS.some(w => lower.includes(w)))  return 'unwell';
  if (FINE_WORDS.some(w => lower.includes(w)))    return 'fine';

  // Default — if unclear, treat as slightly unwell so caregiver stays aware
  return 'unwell';
}

// ── Voice Medication Response Keywords ───────────────────────────────────────

const TAKEN_WORDS = [
  'taken','took','had','done','finished','yes','yep','yeah',
  'already','completed','swallowed','ate','eaten','li liya',
  'kha liya','kha li', // Hindi
];

const LATER_WORDS = [
  'later','wait','sometime','after','hold on','remind','soon',
  'few minutes','give me','not now','baad mein','thodi der',
];

const SKIPPED_WORDS = [
  'skip','no','not','wont','cant','refuse','never','nahi',
  'mat','chod do','ignore',
];

/**
 * Detect medicine action from voice response.
 * Returns: 'taken' | 'later' | 'skipped'
 */
function classifyMedResponse(text) {
  if (!text) return 'later';
  const lower = text.toLowerCase();

  if (TAKEN_WORDS.some(w => lower.includes(w)))   return 'taken';
  if (SKIPPED_WORDS.some(w => lower.includes(w))) return 'skipped';
  if (LATER_WORDS.some(w => lower.includes(w)))   return 'later';

  return 'later'; // safe default
}

// ── Symptom Keyword Extractor ─────────────────────────────────────────────────

const SYMPTOM_FLAGS = [
  'chest pain','breathless','unconscious','fall','bleeding',
  'stroke','paralysis','severe','extreme','cant breathe',
];

/**
 * Check if a symptom transcript is critical (needs immediate alert).
 */
function isCriticalSymptom(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return SYMPTOM_FLAGS.some(w => lower.includes(w));
}

module.exports = { classifyCheckIn, classifyMedResponse, isCriticalSymptom };