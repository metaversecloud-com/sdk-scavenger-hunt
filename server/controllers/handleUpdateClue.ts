import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils";

export const handleUpdateClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId } = credentials
    const { assetId, imageUrl, text } = req.body;

    const { world } = await getWorldDataObject({ credentials, sceneDropId });
    const droppedAsset = await DroppedAsset.create(assetId, credentials.urlSlug, {
      credentials,
    });

    await droppedAsset.updateWebImageLayers(imageUrl, "");

    await world.updateDataObject({
      [`scenes.${sceneDropId}.clues.${assetId}`]: { id: assetId, text, imageUrl },
    })

    return res.json({ text, imageUrl });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateClue",
      message: "Error updating clue.",
      req,
      res,
    });
  }
}
