const express = require("express");
const router = express.Router();
const medicineController = require("../controllers/medicineController");

router.post("/", medicineController.addMedicine);
router.get("/", medicineController.getMedicines);
router.get("/adherence", medicineController.getAdherence);
router.post("/:id/taken", medicineController.markTaken);
router.post("/:id/skipped", medicineController.markSkipped);

module.exports = router;