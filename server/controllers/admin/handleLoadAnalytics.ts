import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleLoadAnalytics = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials

    const assetsList = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);
    const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;

    const dataObject = await getDroppedAssetDataObject(assetId, credentials, true)

    res.json({
      totalClues: clueAssets.length,
      analytics: dataObject.analytics,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadAnalytics",
      message: "Error loading analytics.",
      req,
      res,
    });
  }
};
