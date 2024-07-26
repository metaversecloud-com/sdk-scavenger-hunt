import { Request, Response } from "express";
import { dropLeaves, errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DataObjectType } from "../types.js";
import { Visitor, DroppedAsset } from "../utils/topiaInit.js";
import { addNewRowToGoogleSheets } from "../utils/addNewRowToGoogleSheets.js";

export const handleAnswerChallenge = async (req: Request, res: Response) => {
  try {
    const answer = req.body.answer.toLowerCase();
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { buildableAssetUniqueName, challenge, progress, theme } = dataObject as DataObjectType;

    const isCorrect = challenge.answer?.trim()?.toLowerCase() === answer?.trim()?.toLowerCase();
    if (!isCorrect) return res.json({ isCorrect: false });

    if (progress[profileId]) {
      await world.updateDataObject(
        { [`scenes.${sceneDropId}.progress.${profileId}.challengeDone`]: true },
        {
          analytics: [
            { analyticName: `${theme}-completions`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `completions`, uniqueKey: profileId, profileId, urlSlug },
          ],
        },
      );
    } else {
      await world.updateDataObject(
        { [`scenes.${sceneDropId}.progress.${profileId}`]: { challengeDone: true } },
        {
          analytics: [
            { analyticName: `${theme}-completions`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `completions`, uniqueKey: profileId, profileId, urlSlug },
          ],
        },
      );
    }

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

    const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

    await handleThemeExpression(world, visitor, theme);

    visitor
      .triggerParticle({
        name: "firework1_gold",
        duration: 6,
      })
      .then()
      .catch((error) => JSON.stringify(error));

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

async function handleThemeExpression(world: any, visitor: any, theme: string) {
  try {
    const expressionName = `scavengerHunt-${theme}-1`;
    const analyticName = `${theme}-1-emoteUnlocked`;

    const grantExpressionResult = (await visitor.grantExpression({
      name: expressionName,
    })) as any;

    if (grantExpressionResult?.status === 200 || grantExpressionResult?.data?.statusCode === 200) {
      world
        .updateDataObject({}, { analytics: [{ analyticName }] })
        .then()
        .catch((error) => console.error(error));
      visitor
        .fireToast({ groupId: theme, title: "Congratulations 🌟", text: "You unlocked a new emote!" })
        .then()
        .catch((error) => console.error(error));
    } else {
      visitor
        .fireToast({
          groupId: theme,
          title: "Congratulations 🌟",
          text: "You completed the challenge!",
        })
        .then()
        .catch((error) => console.error(error));
    }
  } catch (error) {
    console.error("Error granting expression to visitor", error);
  }
}
