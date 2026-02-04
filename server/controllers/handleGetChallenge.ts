import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getBadges,
  getCredentials,
  getProfile,
  getUserChallenge,
  getVisitorBadges,
  getWorldDataObject,
  Visitor,
} from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, visitorId, urlSlug } = credentials;

    const promises = [getProfile(credentials), getWorldDataObject({ credentials }), getBadges(credentials)];
    const [{ isAdmin }, { dataObject }, badges] = await Promise.all(promises);
    const { challenge, clues, theme } = dataObject as WorldDataObjectType;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    await visitor.fetchInventoryItems();
    const visitorInventory = getVisitorBadges(visitor.inventoryItems);

    const userChallenge = await getUserChallenge(credentials);

    let cluesFound = 0,
      hasCompletedClues = false,
      hasCompletedChallenge = false,
      totalClues = Object.keys(clues ?? {}).length || 0;

    if (!userChallenge) {
      await visitor.updateDataObject({
        [`${urlSlug}-${sceneDropId}`]: { challengeDone: false, cluesFound: [] },
      });
    } else {
      cluesFound = userChallenge.cluesFound?.length || 0;
      if (cluesFound === totalClues) hasCompletedClues = true;
      hasCompletedChallenge = userChallenge.challengeDone;
    }

    // Fetch leaderboard for admins
    let leaderboard: { name: string; cluesCollected: number; challengeDone: boolean; profileId: string }[] = [];
    if (isAdmin) {
      const keyAsset = await DroppedAsset.create(credentials.assetId, urlSlug, { credentials });
      await keyAsset.fetchDataObject();
      const leaderboardData = (keyAsset.dataObject as { leaderboard?: Record<string, string> })?.leaderboard;

      if (leaderboardData) {
        for (const visitorProfileId in leaderboardData) {
          const data = leaderboardData[visitorProfileId];
          const [displayName, cluesCount, done] = data.split("|");

          leaderboard.push({
            name: displayName,
            cluesCollected: parseInt(cluesCount) || 0,
            challengeDone: done === "true",
            profileId: visitorProfileId,
          });
        }

        // Sort: challenge done first, then by clues collected descending
        leaderboard.sort((a, b) => {
          if (a.challengeDone !== b.challengeDone) {
            return a.challengeDone ? -1 : 1;
          }
          return b.cluesCollected - a.cluesCollected;
        });
      }
    }

    return res.json({
      success: true,
      badges,
      challenge,
      cluesFound,
      hasCompletedClues,
      hasCompletedChallenge,
      isAdmin,
      leaderboard,
      theme,
      totalClues,
      visitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetChallenge",
      message: "Error loading challenge.",
      req,
      res,
    });
  }
};
