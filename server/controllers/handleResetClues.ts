import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getClueDroppedAssets, getCredentials, getConfig } from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";
import { DroppedAssetInterface } from "@rtsdk/topia";

export const handleResetClues = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;

    const { world, dataObject, keyAsset } = await getConfig({ credentials });
    const { theme } = dataObject as WorldDataObjectType;

    const clues = await getClueDroppedAssets({
      sceneDropId,
      uniqueName: `${keyAsset.uniqueName}_${theme}_clue`,
      world,
    });

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await keyAsset.updateDataObject(
      { clues },
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
