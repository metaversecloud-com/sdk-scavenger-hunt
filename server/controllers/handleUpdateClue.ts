import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleUpdateClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId } = credentials;
    const { assetId, imgUrl, contentImgUrl, text } = req.body;

    const { world } = await getWorldDataObject({ credentials, sceneDropId });
    const droppedAsset = await DroppedAsset.create(assetId, credentials.urlSlug, {
      credentials,
    });

    await droppedAsset.updateWebImageLayers("", imgUrl);

    await world.updateDataObject({
      [`scenes.${sceneDropId}.clues.${assetId}`]: { id: assetId, text, imgUrl, contentImgUrl },
    });

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
