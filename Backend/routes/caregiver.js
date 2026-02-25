const express = require("express");
const router = express.Router();
const {
  getCaregiverOverview,
  getStabilityScore,
  markAlertRead,
} = require("../controllers/caregiverController");

router.get("/overview", getCaregiverOverview);
router.get("/stability-score", getStabilityScore);
router.patch("/alerts/:id/read", markAlertRead);

module.exports = router;