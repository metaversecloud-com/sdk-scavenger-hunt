import express from "express";
import {
  handleAnswerChallenge,
  handleCheckInteractiveCredentials,
  handleGetChallenge,
  handleGetConfiguration,
  handleGetClue,
  handleGetProgress,
  handleResetClues,
  handleUpdateChallenge,
  handleUpdateClue,
  handleResetGame,
  handleMoveToClueAsset,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

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

router.get("/progress", handleGetProgress);
router.get("/config", handleGetConfiguration);

router.get("/challenge", handleGetChallenge);
router.post("/update-challenge", handleUpdateChallenge);
router.post("/answer-challenge", handleAnswerChallenge);

router.get("/clue", handleGetClue);
router.post("/update-clue", handleUpdateClue);
router.post("/reset-clues", handleResetClues);
router.post("/reset-game", handleResetGame);
router.post("/walk-up-to-clue-asset", handleMoveToClueAsset);

export default router;
