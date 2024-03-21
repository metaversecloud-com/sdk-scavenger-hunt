import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject, getProfile } from "../../utils";

export const handleLoadChallenge = async (req: Request, res: Response) => {
  const credentials = getCredentials(req.query);
  const { assetId, profileId, sceneDropId } = credentials

  try {
    const droppedAsset = await getDroppedAssetDataObject(assetId, credentials, true);
    const { dataObject } = droppedAsset

    const { challenge, analytics } = dataObject;
    console.log("🚀 ~ file: handleLoadChallenge.ts:14 ~ analytics:", analytics)

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);

    const { isAdmin } = await getProfile(credentials);

    const student = analytics.progress[profileId];
    const hasCompletedClues = student ? student.cluesFound.length === droppedAssets.length : false;

    res.json({ challenge, hasCompletedClues, hasCompletedChallenge: student ? student.challengeDone : false, isAdmin });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleLoadChallenge",
      message: "Error loading challenge.",
      req,
      res,
    });
    return res.json({});
  }
}
