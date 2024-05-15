import { Request, Response } from "express";
import { DataObjectType, ClueType } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;
    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, progress, theme } = dataObject as DataObjectType;
    const clue: ClueType = clues?.[assetId];

    if (!clue) throw new Error(`No clue asset found.`);

    let cluesFound = [];

    if (!progress[profileId]) {
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress.${profileId}`]: {
          challengeDone: false,
          cluesFound: [assetId],
          profileId,
          username,
        },
      });
      cluesFound = [assetId];
    } else {
      cluesFound = progress[profileId].cluesFound;
      if (!cluesFound.includes(assetId)) {
        cluesFound = [...cluesFound, assetId];
        await world.updateDataObject({
          [`scenes.${sceneDropId}.progress.${profileId}.cluesFound`]: cluesFound,
        });
      }
    }

    return res.send({
      success: true,
      text: clue.text || "test clue text",
      imgUrl: clue.imgUrl || "",
      contentImgUrl: clue.contentImgUrl || "",
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
      theme,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
