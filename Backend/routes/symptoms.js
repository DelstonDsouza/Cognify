const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/symptomController');

router.post('/symptoms', ctrl.logSymptom);
router.get('/symptoms',  ctrl.getSymptoms);

module.exports = router;