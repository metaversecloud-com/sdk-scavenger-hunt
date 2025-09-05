import { Request, Response } from "express";
import { errorHandler, getCredentials, Visitor } from "../utils/index.js";

export const handleRestartChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, sceneDropId, visitorId, urlSlug } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    await visitor.updateDataObject(
      {
        [`${urlSlug}-${sceneDropId}`]: { challengeDone: false, cluesFound: [] },
      },
      { analytics: [{ analyticName: "restarts", uniqueKey: profileId, profileId, urlSlug }] },
    );

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
