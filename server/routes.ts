import express from "express";
import {
  handleAnswerChallenge,
  handleGetChallenge,
  handleGetConfiguration,
  handleGetClue,
  handleGetProgress,
  handleResetClues,
  handleUpdateChallenge,
  handleUpdateClue,
  handleMoveToClueAsset,
  handleAddNewClue,
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
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      API_URL: process.env.API_URL ? process.env.API_URL : "NOT SET",
      SKIP_PREFLIGHT_CHECK: process.env.SKIP_PREFLIGHT_CHECK ? process.env.SKIP_PREFLIGHT_CHECK : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      COMMIT_HASH: process.env.COMMIT_HASH ? process.env.COMMIT_HASH : "NOT SET",
      IMG_ASSET_ID: process.env.IMG_ASSET_ID ? process.env.IMG_ASSET_ID : "NOT SET",
      PARTICLE_EFFECT_NAME_FOR_FINAL_CLUE: process.env.PARTICLE_EFFECT_NAME_FOR_FINAL_CLUE
        ? process.env.PARTICLE_EFFECT_NAME_FOR_FINAL_CLUE
        : "NOT SET",
      PARTICLE_EFFECT_NAME_FOR_GET_CLUE: process.env.PARTICLE_EFFECT_NAME_FOR_GET_CLUE
        ? process.env.PARTICLE_EFFECT_NAME_FOR_GET_CLUE
        : "NOT SET",
      PARTICLE_EFFECT_NAME_FOR_EMOTE_UNLOCK: process.env.PARTICLE_EFFECT_NAME_FOR_EMOTE_UNLOCK
        ? process.env.PARTICLE_EFFECT_NAME_FOR_EMOTE_UNLOCK
        : "NOT SET",
    },
  });
});

router.get("/progress", handleGetProgress);
router.get("/config", handleGetConfiguration);

router.get("/challenge", handleGetChallenge);
router.post("/update-challenge", handleUpdateChallenge);
router.post("/answer-challenge", handleAnswerChallenge);

router.get("/clue", handleGetClue);
router.post("/update-clue", handleUpdateClue);
router.post("/reset-clues", handleResetClues);
router.post("/walk-up-to-clue-asset", handleMoveToClueAsset);
router.post("/add-new-clue", handleAddNewClue);

export default router;
