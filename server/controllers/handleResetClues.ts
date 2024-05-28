import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getClueDroppedAssets,
  getCredentials,
  getWorldDataObject,
} from "../utils/index.js";
import { DataObjectType } from "../types.js";

export const handleResetClues = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId, urlSlug } = credentials;

    const { world, dataObject } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { theme } = dataObject as DataObjectType;

    const keyAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    // @ts-ignore
    const clues = await getClueDroppedAssets({ uniqueName: `${keyAsset.uniqueName}_${theme}_clue`, world });

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { [`scenes.${sceneDropId}.clues`]: clues },
      { lock: { lockId, releaseLock: true } },
      { analytics: [`${theme}-resets`] },
    );

    return res.json({ success: true, clues });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetClues",
      message: "Error resetting clues.",
      req,
      res,
    });
  }
};
