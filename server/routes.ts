import express from "express";
// import {
//   loadClue,
//   loadConfiguration,
//   loadAnalytics,
//   loadChallenge,
//   answerChallenge,
//   updateClue,
//   loadClueWithId,
//   updateChallenge,
// } from "./controllers/index.js";

import { loadClue } from "./controllers/clue.js";
import { loadChallenge } from "./controllers/challenge.js";
import { loadConfiguration } from "./controllers/admin/config.js";
import { loadAnalytics } from "./controllers/admin/analytics.js";
import { loadClueWithId, updateClue } from "./controllers/admin/clue.js";
import { updateChallenge } from "./controllers/admin/updateChallenge.js";
import { answerChallenge } from "./controllers/challenge.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// Admin Routes
router.get("/admin/config", loadConfiguration);
router.get("/admin/analytics", loadAnalytics);
router.get("/admin/clue/:id", loadClueWithId);
router.post("/admin/updateChallenge", updateChallenge);
router.post("/admin/updateClue", updateClue);

// User Routes
router.post("/answerChallenge", answerChallenge);
router.get("/challenge", loadChallenge);
router.get("/clue/:id", loadClue);

export default router;
