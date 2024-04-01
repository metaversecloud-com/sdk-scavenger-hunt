import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleUpdateChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials;

    const { answer, buildableAssetUniqueName, text } = req.body;

    const { world } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });

    const lowerCaseAnswer = answer.toLowerCase();

    await world.updateDataObject({
      [`scenes.${sceneDropId}.buildableAssetUniqueName`]: buildableAssetUniqueName,
      [`scenes.${sceneDropId}.challenge.answer`]: lowerCaseAnswer,
      [`scenes.${sceneDropId}.challenge.text`]: text,
    });

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateChallenge",
      message: "Error updating challenge.",
      req,
      res,
    });
  }
};
