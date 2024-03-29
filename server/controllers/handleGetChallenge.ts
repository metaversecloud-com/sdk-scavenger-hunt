import { Request, Response } from "express";
import { errorHandler, getCredentials, getProfile, getWorldDataObject } from "../utils";
import { DataObjectType } from "../types";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;

    const { isAdmin } = await getProfile(credentials);

    const { dataObject, world } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
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
