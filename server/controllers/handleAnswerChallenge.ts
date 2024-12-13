import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject, Visitor } from "../utils/index.js";
import { DataObjectType } from "../types.js";
import { addNewRowToGoogleSheets } from "../utils/addNewRowToGoogleSheets.js";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { challenge, theme } = dataObject as DataObjectType;

    const isCorrect = challenge.answer?.trim()?.toLowerCase() === answer?.trim()?.toLowerCase();
    if (!isCorrect) return res.json({ isCorrect: false });

    const analytics: { analyticName: string; uniqueKey?: string; profileId?: string; urlSlug?: string }[] = [
      { analyticName: `${theme}-completions`, uniqueKey: profileId, profileId, urlSlug },
      { analyticName: `completions`, uniqueKey: profileId, profileId, urlSlug },
    ];

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    const grantExpressionResult = await visitor.grantExpression({ name: `scavengerHunt-${theme}-1` });

    let text = "You completed the challenge!";

    // @ts-ignore
    if (grantExpressionResult.status === 200 || grantExpressionResult?.data?.statusCode === 200) {
      analytics.push({ analyticName: `${theme}-1-emoteUnlocked` });
      text = "You unlocked a new emote!";
    }

    world.updateDataObject({ [`scenes.${sceneDropId}.progress.${profileId}`]: { challengeDone: true } }, { analytics });

    visitor
      .fireToast({
        groupId: theme,
        title: "Congratulations 🌟",
        text,
      })
      .then()
      .catch((error) => console.error(error));

    visitor
      .triggerParticle({
        name: "explosion_float",
        duration: 6,
      })
      .then()
      .catch((error) => JSON.stringify(error));

    addNewRowToGoogleSheets({
      identityId: req?.query?.identityId,
      displayName: req?.query?.displayName,
      username: null,
      appName: "ScavengerHunt",
      event: `${theme}-completions`,
      urlSlug,
    })
      .then()
      .catch();

    return res.json({ success: true, isCorrect: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAnswerChallenge",
      message: "Error answering challenge.",
      req,
      res,
    });
  }
};
