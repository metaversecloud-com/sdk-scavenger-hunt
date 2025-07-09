import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleUpdateClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;
    const { assetId, imgUrl, contentImgUrl, text } = req.body;

    const { world } = await getWorldDataObject({ credentials, sceneDropId });
    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });

    await Promise.all([
      droppedAsset.updateWebImageLayers("", imgUrl),
      await droppedAsset.updateDataObject({ id: assetId, text, imgUrl, contentImgUrl }),
      world.updateDataObject({
        [`scenes.${sceneDropId}.clues.${assetId}`]: { id: assetId, text, imgUrl, contentImgUrl },
      }),
    ]);

    return res.json({ success: true, text, imgUrl, contentImgUrl });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateClue",
      message: "Error updating clue.",
      req,
      res,
    });
  }
};
