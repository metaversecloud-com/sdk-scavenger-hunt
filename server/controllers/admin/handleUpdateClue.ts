import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials } from "../../utils";

export const handleUpdateClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, imageUrl, text } = req.body;

    const droppedAsset = await DroppedAsset.create(assetId, credentials.urlSlug, {
      credentials,
    });

    await droppedAsset.updateWebImageLayers(imageUrl, "");
    await droppedAsset.updateDataObject({ text, imageUrl });

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
