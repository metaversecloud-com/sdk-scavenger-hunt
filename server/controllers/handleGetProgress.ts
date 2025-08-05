import { Request, Response } from "express";
import { errorHandler, getCredentials, getUserChallenge, getWorldDataObject, Visitor } from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";

export const handleGetProgress = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId } = credentials;

    const { dataObject } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, theme } = dataObject as WorldDataObjectType;

    const userChallenge = await getUserChallenge(credentials);

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
