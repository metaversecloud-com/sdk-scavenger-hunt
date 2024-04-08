import { Request, Response } from "express";
import { errorHandler, getCredentials, getProfile, getWorldDataObject } from "../utils/index.js";
import { DataObjectType } from "../types.js";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;

    const promises = [getProfile(credentials), getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId })];
    const [{ isAdmin }, { world, dataObject }] = await Promise.all(promises);
    const { progress, challenge, clues, theme } = dataObject as DataObjectType;

    let hasCompletedClues = false,
      hasCompletedChallenge = false;

    if (!progress[profileId]) {
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress`]: {
          [profileId]: { challengeDone: false, cluesFound: [], profileId, username },
        },
      });
    } else {
      const cluesFound = progress[profileId].cluesFound.length;
      const totalClues = Object.keys(clues).length;
      if (cluesFound === totalClues) hasCompletedClues = true;
      hasCompletedChallenge = progress[profileId].challengeDone;
    }

    return res.json({
      success: true,
      challenge,
      hasCompletedClues,
      hasCompletedChallenge,
      isAdmin,
      theme,
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
