import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, Visitor } from "../utils/index.js";

export const handleRestartChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, visitorId, urlSlug } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    await visitor.updateDataObject(
      {
        [`${urlSlug}_${sceneDropId}`]: { challengeDone: false, cluesFound: [], answerAttempts: 0 },
      },
      { analytics: [{ analyticName: "restarts", uniqueKey: profileId, profileId, urlSlug }] },
    );

    // Remove the visitor's entry from the leaderboard
    const keyAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
    await keyAsset.fetchDataObject();
    const leaderboardData = (keyAsset.dataObject as { leaderboard?: Record<string, string> })?.leaderboard;

    if (leaderboardData && leaderboardData[profileId]) {
      delete leaderboardData[profileId];
      await keyAsset.updateDataObject({ leaderboard: leaderboardData });
    }

    return res.json({
      cluesFound: 0,
      hasCompletedClues: false,
      hasCompletedChallenge: false,
      totalClues: 0,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRestartChallenge",
      message: "Error restarting challenge.",
      req,
      res,
    });
  }
};
