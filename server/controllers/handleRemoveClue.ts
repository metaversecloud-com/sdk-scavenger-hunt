import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DroppedAsset } from "../utils/topiaInit.js";

export const handleRemoveClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;
    const { clue } = req.body;

    if (!clue?.id) {
      return res.status(400).send({ success: false, message: "The clue asset id is missing." });
    }

    const { dataObject, world } = await getWorldDataObject({ credentials });

    const clues = dataObject.clues;
    delete clues[clue.id];

    await world.updateDataObject(
      {
        [`scenes.${sceneDropId}.clues`]: clues,
      },
      {},
    );

    const droppedAsset = DroppedAsset.create(clue.id, urlSlug, { credentials });
    await droppedAsset.deleteDroppedAsset();

    return res.send({ clues, success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleRemoveClue",
      message: "Error removing clue.",
      req,
      res,
    });
  }
};
