import { Request, Response } from "express";
import { dropLeaves, errorHandler, getCredentials, getDroppedAssetDataObject } from "../../utils";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;

    const droppedAsset = await getDroppedAssetDataObject(assetId, credentials, true);
    const { dataObject } = droppedAsset

    const { challenge, analytics } = dataObject as any;

    const isCorrect = challenge.answer === answer;
    if (!isCorrect) return res.json({ isCorrect: false });

    if(analytics.progress[profileId]) {
      await droppedAsset.updateDataObject({ [`analytics.progress.${profileId}.challengeDone`]: true });
    } else {
      await droppedAsset.updateDataObject({ [`analytics.progress.${profileId}`]: { challengeDone: true } });
    }

    await dropLeaves(credentials, sceneDropId);

    return res.json({ isCorrect: true });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleAnswerChallenge",
      message: "Error answering challenge.",
      req,
      res,
    });
    return res.json({ isCorrect: false });
  }
}
