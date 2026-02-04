import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleUpdateChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, sceneDropId, urlSlug } = credentials;
    const {
      answer,
      buildableAssetUniqueName,
      imgUrl,
      title,
      text,
      selectedEmote,
      questionType,
      options,
      correctAnswers,
    } = req.body;

    const getWorldDataObjectResult = await getWorldDataObject({ credentials });
    if (getWorldDataObjectResult instanceof Error) throw getWorldDataObjectResult;

    const { world } = getWorldDataObjectResult;

    const lowerCaseAnswer = answer ? answer.toLowerCase() : undefined;

    await world.updateDataObject(
      {
        [`scenes.${sceneDropId}.buildableAssetUniqueName`]: buildableAssetUniqueName,
        [`scenes.${sceneDropId}.challenge.answer`]: lowerCaseAnswer,
        [`scenes.${sceneDropId}.challenge.imgUrl`]: imgUrl,
        [`scenes.${sceneDropId}.challenge.title`]: title,
        [`scenes.${sceneDropId}.challenge.text`]: text,
        [`scenes.${sceneDropId}.challenge.selectedEmote`]: selectedEmote,
        [`scenes.${sceneDropId}.challenge.questionType`]: questionType,
        [`scenes.${sceneDropId}.challenge.options`]: options,
        [`scenes.${sceneDropId}.challenge.correctAnswers`]: correctAnswers,
        [`scenes.${sceneDropId}.challenge.lastUpdated`]: new Date().toISOString(),
      },
      { analytics: [{ analyticName: `challengeUpdates`, uniqueKey: profileId, profileId, urlSlug }] },
    );

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
