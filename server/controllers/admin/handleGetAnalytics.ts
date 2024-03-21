import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleGetAnalytics = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);
    const dataObject = await getDroppedAssetDataObject(assetId, credentials, true)

    return res.json({
      totalClues: droppedAssets.length - 1,
      analytics: dataObject.analytics,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetAnalytics",
      message: "Error loading analytics.",
      req,
      res,
    });
  }
};
