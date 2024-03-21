import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject, getProfile } from "../../utils";

export const handleGetChallenge = async (req: Request, res: Response) => {
  const credentials = getCredentials(req.query);
  const { assetId, profileId, sceneDropId } = credentials

  try {
    const droppedAsset = await getDroppedAssetDataObject(assetId, credentials, true);
    const { dataObject } = droppedAsset

    const { challenge, analytics } = dataObject;

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);

    const { isAdmin } = await getProfile(credentials);

    const student = analytics.progress[profileId];
    const hasCompletedClues = student ? Object.keys(student.cluesFound).length >= Object.keys(droppedAssets).length - 1 : false;

    return res.json({ challenge, hasCompletedClues, hasCompletedChallenge: student ? student.challengeDone : false, isAdmin });
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
}
