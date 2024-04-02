import { Request, Response } from "express";
import { dropLeaves, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DataObjectType } from "../types.js";
import { Visitor } from "../utils/topiaInit.js";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { buildableAssetUniqueName, challenge, progress, theme } = dataObject as DataObjectType;

    const isCorrect = challenge.answer?.trim()?.toLowerCase() === answer?.trim()?.toLowerCase();
    if (!isCorrect) return res.json({ isCorrect: false });

    if (progress[profileId]) {
      await world.updateDataObject({ [`scenes.${sceneDropId}.progress.${profileId}.challengeDone`]: true });
    } else {
      await world.updateDataObject({ [`scenes.${sceneDropId}.progress.${profileId}`]: { challengeDone: true } });
    }

    if (theme === "national-park") {
      if (buildableAssetUniqueName) await dropLeaves({ buildableAssetUniqueName, credentials, sceneDropId });
    } else if (theme === "robot") {
      const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

      try {
        await visitor.grantExpression({
          name: `scavengerHunt-robot-1`,
        });
      } catch (error) {
        console.error("Error granting expression to visitor", error);
      }
    }
    return res.json({ success: true, isCorrect: true });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleAnswerChallenge",
      message: "Error answering challenge.",
      req,
      res,
    });
  }
};
