import { Request, Response } from "express";
import { dropLeaves, errorHandler, getCredentials, getWorldDataObject } from "../utils";
import { DataObjectType } from "../types";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { buildableAssetUniqueName, challenge, progress } = dataObject as DataObjectType;

    const isCorrect = challenge.answer === answer;
    if (!isCorrect) return res.json({ isCorrect: false });

    if (progress[profileId]) {
      await world.updateDataObject({ [`scenes.${sceneDropId}.progress.${profileId}.challengeDone`]: true });
    } else {
      await world.updateDataObject({ [`scenes.${sceneDropId}.progress.${profileId}`]: { challengeDone: true } });
    }

    if (buildableAssetUniqueName) await dropLeaves({ buildableAssetUniqueName, credentials, sceneDropId });

    return res.json({ success: true, isCorrect: true });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleAnswerChallenge",
      message: "Error answering challenge.",
      req,
      res,
    });
    return res.json({ success: false, isCorrect: false });
  }
};
