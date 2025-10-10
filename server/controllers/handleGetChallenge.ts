import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  getProfile,
  getUserChallenge,
  getWorldDataObject,
  Visitor,
} from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, visitorId, urlSlug } = credentials;

    const promises = [getProfile(credentials), getWorldDataObject({ credentials })];
    const [{ isAdmin }, { dataObject }] = await Promise.all(promises);
    const { challenge, clues, theme } = dataObject as WorldDataObjectType;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
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
