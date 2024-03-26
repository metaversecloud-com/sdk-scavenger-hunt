import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  getDroppedAssetBySceneDropId,
  getDroppedAssetDataObject,
  getProfile,
} from "../../utils";

export const handleGetChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;

    const droppedAsset = await getDroppedAssetDataObject({ droppedAssetId: assetId, credentials, isKeyAsset: true });
    const { dataObject } = droppedAsset;

    const { challenge, analytics } = dataObject as any;

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId, credentials);

    const { isAdmin } = await getProfile(credentials);

    const userCluesFound = analytics.progress[profileId];
    const hasCompletedClues = userCluesFound
      ? Object.keys(userCluesFound).length >= Object.keys(droppedAssets).length - 4
      : false;

    return res.json({
      challenge,
      hasCompletedClues,
      hasCompletedChallenge: false,
      isAdmin,
    });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleGetChallenge",
      message: "Error loading challenge.",
      req,
      res,
    });
    return res.json({});
  }
};
