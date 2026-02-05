import express from "express";
import {
  handleAnswerChallenge,
  handleGetChallenge,
  handleGetConfiguration,
  handleGetClue,
  handleResetClues,
  handleUpdateChallenge,
  handleUpdateClue,
  handleMoveToClueAsset,
  handleAddNewClue,
  handleRemoveClue,
  handleRestartChallenge,
} from "./controllers/index.js";
import { getVersion } from "./utils/getVersion.js";

const SERVER_START_DATE = new Date();

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Hello from server!" });
});

router.get("/system/health", (req, res) => {
  return res.json({
    appVersion: getVersion(),
    status: "OK",
    serverStartDate: SERVER_START_DATE,
    envs: {
      NODE_ENV: process.env.NODE_ENV,
      COMMIT_HASH: process.env.COMMIT_HASH ? process.env.COMMIT_HASH : "NOT SET",
      SHOWCASE_WORLDS_URLS: ["https://topia.io/scavenger-hunt-prod"],
      INSTANCE_DOMAIN: process.env.INSTANCE_DOMAIN ? process.env.INSTANCE_DOMAIN : "NOT SET",
      INTERACTIVE_KEY: process.env.INTERACTIVE_KEY ? process.env.INTERACTIVE_KEY : "NOT SET",
      API_URL: process.env.API_URL ? process.env.API_URL : "NOT SET",
      SKIP_PREFLIGHT_CHECK: process.env.SKIP_PREFLIGHT_CHECK ? process.env.SKIP_PREFLIGHT_CHECK : "NOT SET",
      INTERACTIVE_SECRET: process.env.INTERACTIVE_SECRET ? "SET" : "NOT SET",
      IMG_ASSET_ID: process.env.IMG_ASSET_ID ? process.env.IMG_ASSET_ID : "NOT SET",
      GOOGLESHEETS_CLIENT_EMAIL: process.env.GOOGLESHEETS_CLIENT_EMAIL ? "SET" : "NOT SET",
      GOOGLESHEETS_SHEET_ID: process.env.GOOGLESHEETS_SHEET_ID ? "SET" : "NOT SET",
      GOOGLESHEETS_PRIVATE_KEY: process.env.GOOGLESHEETS_PRIVATE_KEY ? "SET" : "NOT SET",
    },
  });
});

router.get("/config", handleGetConfiguration);

router.get("/challenge", handleGetChallenge);
router.post("/update-challenge", handleUpdateChallenge);
router.post("/answer-challenge", handleAnswerChallenge);
router.post("/restart-challenge", handleRestartChallenge);

router.get("/clue", handleGetClue);
router.post("/update-clue", handleUpdateClue);
router.post("/remove-clue", handleRemoveClue);
router.post("/reset-clues", handleResetClues);
router.post("/walk-up-to-clue-asset", handleMoveToClueAsset);
router.post("/add-new-clue", handleAddNewClue);

export default router;
