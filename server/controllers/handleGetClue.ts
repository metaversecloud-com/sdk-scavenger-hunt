import { Request, Response } from "express";
import { DataObjectType, ClueType } from '../types';
import {
  errorHandler,
  getCredentials,
  getWorldDataObject,
} from "../utils";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, progress } = dataObject as DataObjectType;

    const clue: ClueType = clues?.[assetId]
    if (!clue) throw new Error(`No clue asset found.`);

    let cluesFound = []

    if (!progress[profileId]) {
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress`]: {
          [profileId]: { challengeDone: false, cluesFound: [assetId], profileId, username }
        }
      });
    } else if (!progress[profileId].cluesFound.includes(assetId)) {
      cluesFound = progress[profileId].cluesFound
      cluesFound.push(assetId);
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress.${profileId}.cluesFound`]: cluesFound,
      });
    } else {
      cluesFound = progress[profileId].cluesFound
    }

    return res.send({
      success: true,
      text: clue.text || "test clue text",
      imageUrl: clue.imageUrl || "",
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
    });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
