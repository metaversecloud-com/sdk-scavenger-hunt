import { Request, Response } from "express";
import { errorHandler, getCredentials, getProfile, getWorldDataObject } from "../utils/index.js";
import { DataObjectType } from "../types.js";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, sceneDropId, displayName } = credentials;

    const promises = [getProfile(credentials), getWorldDataObject({ credentials, sceneDropId })];
    const [{ isAdmin }, { world, dataObject }] = await Promise.all(promises);
    const { progress, challenge, clues, theme } = dataObject as DataObjectType;

    let cluesFound = 0,
      hasCompletedClues = false,
      hasCompletedChallenge = false,
      totalClues = Object.keys(clues).length;

    if (!progress[profileId]) {
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress.${[profileId]}`]: {
          challengeDone: false,
          cluesFound: [],
          profileId,
          username: displayName,
        },
      });
    } else {
      cluesFound = progress[profileId].cluesFound?.length || 0;
      if (cluesFound === totalClues) hasCompletedClues = true;
      hasCompletedChallenge = progress[profileId].challengeDone;
    }

    return res.json({
      success: true,
      challenge,
      cluesFound,
      hasCompletedClues,
      hasCompletedChallenge,
      isAdmin,
      theme,
      totalClues,
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
