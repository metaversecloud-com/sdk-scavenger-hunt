import { Request, Response } from "express";
import { errorHandler, getCredentials, getUserChallenge, getWorldDataObject, Visitor } from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";

export const handleGetProgress = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);

    const getWorldDataObjectResult = await getWorldDataObject({ credentials });
    if (getWorldDataObjectResult instanceof Error) throw getWorldDataObjectResult;

    const { dataObject } = getWorldDataObjectResult;
    const { clues, theme } = dataObject as WorldDataObjectType;

    const userChallengeResult = await getUserChallenge(credentials);
    if (userChallengeResult instanceof Error) throw userChallengeResult;
    const userChallenge = userChallengeResult;

    return res.json({
      success: true,
      totalClues: Object.keys(clues).length || 0,
      progress: userChallenge,
      theme,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetProgress",
      message: "Error loading progress.",
      req,
      res,
    });
  }
};
