const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/analysisController');

router.get('/routine-analysis', ctrl.routineAnalysis);
router.get('/stability-score',  ctrl.stabilityScore);
router.get('/inactivity-alert', ctrl.inactivityAlert);

module.exports = router;