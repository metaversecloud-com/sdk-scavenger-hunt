import express from "express";
import {
  handleAnswerChallenge,
  handleCheckInteractiveCredentials,
  handleLoadAnalytics,
  handleLoadChallenge,
  handleLoadConfiguration,
  handleLoadClue,
  handleLoadClueWithId,
  handleUpdateChallenge,
  handleUpdateClue,
} from "./controllers";
import { getVersion } from "./utils/getVersion";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN,
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY,
    },
  });
});

router.get("/system/interactive-credentials", handleCheckInteractiveCredentials);

// Admin Routes
router.get("/admin/analytics", handleLoadAnalytics);
router.get("/admin/config", handleLoadConfiguration);
router.get("/admin/clue/:id", handleLoadClueWithId);
router.post("/admin/updateChallenge", handleUpdateChallenge);
router.post("/admin/updateClue", handleUpdateClue);

// User Routes
router.post("/answerChallenge", handleAnswerChallenge);
router.get("/challenge", handleLoadChallenge);
router.get("/clue/:id", handleLoadClue);

export default router;
