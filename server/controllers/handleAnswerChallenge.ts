import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject, Visitor } from "../utils/index.js";
import { WorldDataObjectType } from "../types.js";
import { addNewRowToGoogleSheets } from "../utils/addNewRowToGoogleSheets.js";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { dataObject } = await getWorldDataObject({ credentials });
    const { challenge, theme } = dataObject as WorldDataObjectType;

    const isCorrect = challenge.answer?.trim()?.toLowerCase() === answer?.trim()?.toLowerCase();
    if (!isCorrect) return res.json({ isCorrect: false });

    const analytics: { analyticName: string; uniqueKey?: string; profileId?: string; urlSlug?: string }[] = [
      { analyticName: `${theme}-completions`, uniqueKey: profileId, profileId, urlSlug },
      { analyticName: `completions`, uniqueKey: profileId, profileId, urlSlug },
    ];

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    const emote = challenge.selectedEmote ? { id: challenge.selectedEmote } : { name: `scavengerHunt-${theme}-1` };
    const grantExpressionResult = await visitor.grantExpression(emote);
    let text = "You completed the challenge!";
    if (grantExpressionResult.success === true) {
      analytics.push({ analyticName: `${theme}-1-emoteUnlocked` });
      text = "You unlocked a new emote!";
    }

    visitor.updateDataObject({ [`${urlSlug}-${sceneDropId}.challengeDone`]: true }, { analytics });

    visitor
      .fireToast({
        groupId: theme,
        title: "Congratulations 🌟",
        text,
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "handleAnswerChallenge",
          message: "Error firing toast",
        }),
      );

    visitor
      .triggerParticle({
        name: "explosion_float",
        duration: 6,
      })
      .catch((error) =>
        errorHandler({
          error,
          functionName: "handleAnswerChallenge",
          message: "Error triggering particle effects",
        }),
      );

    addNewRowToGoogleSheets({
      identityId: req?.query?.identityId,
      displayName: req?.query?.displayName,
      username: null,
      appName: "ScavengerHunt",
      event: `${theme}-completions`,
      urlSlug,
    });

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
