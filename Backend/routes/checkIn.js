const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/checkInController');

router.post('/morning-checkin',          ctrl.morningCheckIn);
router.post('/voice-medication-response', ctrl.voiceMedResponse);

module.exports = router;