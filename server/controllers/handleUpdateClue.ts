import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleUpdateClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;
    const { assetId, imgUrl, contentImgUrl, isVideo, linkBehavior, text } = req.body;

    const { world } = await getWorldDataObject({ credentials, sceneDropId });
    const droppedAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });

    const protocol = process.env.INSTANCE_PROTOCOL;
    const host = req.hostname;
    let BASE_URL = `${protocol}://${host}`;
    if (host === "localhost") BASE_URL = "http://localhost:3001";

    await Promise.all([
      droppedAsset.updateWebImageLayers("", imgUrl),
      droppedAsset.updateDataObject({ id: assetId, text, imgUrl, contentImgUrl, isVideo, linkBehavior }),
      world.updateDataObject({
        [`scenes.${sceneDropId}.clues.${assetId}`]: { id: assetId, text, imgUrl, contentImgUrl, isVideo, linkBehavior },
      }),
      droppedAsset.updateClickType({
        clickableLink: `${BASE_URL}/clue`,
        clickableLinkTitle: "Scavenger Hunt",
        clickableDisplayTextDescription: "Scavenger Hunt",
        clickableDisplayTextHeadline: "Scavenger Hunt",
        isOpenLinkInDrawer: linkBehavior === "drawer" || false,
        isForceLinkInIframe: linkBehavior === "modal" || false,
      }),
    ]);

    return res.json({ success: true, text, imgUrl, contentImgUrl, isVideo, linkBehavior });
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
