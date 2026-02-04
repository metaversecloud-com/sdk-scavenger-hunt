import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getClueDroppedAssets,
  getCredentials,
  getWorldDataObject,
} from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleResetClues = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId, urlSlug } = credentials;

    const getWorldDataObjectResult = await getWorldDataObject({ credentials });
    if (getWorldDataObjectResult instanceof Error) throw getWorldDataObjectResult;

    const { world, dataObject } = getWorldDataObjectResult;
    const { theme } = dataObject as WorldDataObjectType;

    const keyAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });

    const getClueDroppedAssetsResult = await getClueDroppedAssets({
      sceneDropId,
      uniqueName: `${keyAsset.uniqueName}_${theme}_clue`,
      world,
    });
    if (getClueDroppedAssetsResult instanceof Error) throw getClueDroppedAssetsResult;

    const clues = getClueDroppedAssetsResult;

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { [`scenes.${sceneDropId}.clues`]: clues },
      {
        analytics: [
          { analyticName: `${theme}-resets`, urlSlug },
          { analyticName: `resets`, urlSlug },
        ],
        lock: { lockId, releaseLock: true },
      },
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
