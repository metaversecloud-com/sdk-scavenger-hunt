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
    })
      .then()
      .catch();

    if (theme === "national-park") {
      if (buildableAssetUniqueName) {
        await dropLeaves({ buildableAssetUniqueName, credentials, sceneDropId });
      }
    } else if (theme === "robot") {
      const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

      try {
        const grantExpressionResult = (await visitor.grantExpression({
          name: `scavengerHunt-robot-1`,
        })) as any;

        if (grantExpressionResult?.data?.statusCode === 200) {
          await world.updateDataObject({}, { analytics: [{ analyticName: `robot-1-emoteUnlocked` }] });
          await visitor.fireToast({ groupId: "space", title: "Congratulations 🌟", text: "You unlocked a new emote!" });
        } else {
          await visitor.fireToast({
            groupId: "space",
            title: "Congratulations 🌟",
            text: "You completed the challenge!",
          });
        }
      } catch (error) {
        console.error("Error granting expression to visitor", error);
      }
    } else if (theme === "space") {
      const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

      try {
        const grantExpressionResult = (await visitor.grantExpression({
          name: `scavengerHunt-space-1`,
        })) as any;

        if (grantExpressionResult?.data?.statusCode === 200) {
          await world.updateDataObject({}, { analytics: [{ analyticName: `space-1-emoteUnlocked` }] });
          await visitor.fireToast({ groupId: "space", title: "Congratulations 🌟", text: "You unlocked a new emote!" });
        } else {
          await visitor.fireToast({
            groupId: "space",
            title: "Congratulations 🌟",
            text: "You completed the challenge!",
          });
        }
      } catch (error) {
        console.error("Error granting expression to visitor", error);
      }
    } else if (theme === "bird") {
      const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

      try {
        const grantExpressionResult = (await visitor.grantExpression({
          name: `scavengerHunt-bird-1`,
        })) as any;

        if (grantExpressionResult?.data?.statusCode === 200) {
          await world.updateDataObject({}, { analytics: [{ analyticName: `bird-1-emoteUnlocked` }] });
          await visitor.fireToast({ groupId: "bird", title: "Congratulations 🌟", text: "You unlocked a new emote!" });
        } else {
          await visitor.fireToast({
            groupId: "bird",
            title: "Congratulations 🌟",
            text: "You completed the challenge!",
          });
        }
      } catch (error) {
        console.error("Error granting expression to visitor", error);
      }
    }

    renderEmoteParticleEffects({ world, assetId, credentials })
      .then()
      .catch(() => console.error("Failed to render particle effects"));

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

async function renderEmoteParticleEffects({ world, assetId, credentials }) {
  const droppedAsset = await DroppedAsset.get(assetId, credentials?.urlSlug, { credentials });
  await world.triggerParticle({
    name: process.env.PARTICLE_EFFECT_NAME_FOR_EMOTE_UNLOCK || "firework1_gold",
    duration: 6,
    position: {
      x: droppedAsset?.position?.x,
      y: droppedAsset?.position?.y,
    },
  });
}
