/**
 * SEVA SAATI — Backend Server
 * Team: Cognify | ST ALOYSIUS UNIVERSITY | PS03HC
 */
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use("/api/medicines",  require("./routes/medicines"));
app.use("/api/symptoms",   require("./routes/symptoms"));
app.use("/api/caregiver",  require("./routes/caregiver"));
//app.use("/api",            require("./routes/voice"));
//app.use("/api",            require("./routes/routine"));

app.get("/", (req, res) => {
  res.json({
    project: "Seva Saati", team: "Cognify",
    college: "ST ALOYSIUS UNIVERSITY", problemStatement: "PS03HC",
    status: "Server is running ✅",
    endpoints: {
      medicines:        "GET|POST /api/medicines",
      adherence:        "GET /api/medicines/adherence",
      markTaken:        "POST /api/medicines/:id/taken",
      markSkipped:      "POST /api/medicines/:id/skipped",
      morningCheckin:   "POST /api/morning-checkin",
      voiceMedResponse: "POST /api/voice-medication-response",
      symptoms:         "GET|POST /api/symptoms",
      routineAnalysis:  "GET /api/routine-analysis",
      inactivity:       "GET /api/inactivity-alert",
      caregiver:        "GET /api/caregiver/overview",
      stability:        "GET /api/caregiver/stability-score",
    },
  });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.listen(PORT, () => {
  console.log(`\n  Seva Saati Backend running at http://localhost:${PORT}\n`);
});

module.exports = app;