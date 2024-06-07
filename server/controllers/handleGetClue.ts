import { Request, Response } from "express";
import { DataObjectType, ClueType } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DroppedAsset, Visitor } from "../utils/topiaInit.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username, urlSlug } = credentials;
    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, progress, theme } = dataObject as DataObjectType;
    const clue: ClueType = clues?.[assetId];

    if (!clue) throw new Error(`No clue asset found.`);

    let cluesFound = [];

    if (!progress[profileId]) {
      await world.updateDataObject(
        {
          [`scenes.${sceneDropId}.progress.${profileId}`]: {
            challengeDone: false,
            cluesFound: [assetId],
            profileId,
            username,
          },
        },
        { analytics: [{ analyticName: `${theme}-starts`, uniqueKey: profileId, profileId, urlSlug }] },
      );
      cluesFound = [assetId];
    } else {
      cluesFound = progress[profileId].cluesFound;
      if (!cluesFound.includes(assetId)) {
        cluesFound = [...cluesFound, assetId];
        await world.updateDataObject({
          [`scenes.${sceneDropId}.progress.${profileId}.cluesFound`]: cluesFound,
        });
        if (cluesFound.length == Object.keys(dataObject.clues).length) {
          const visitor = Visitor.create(credentials?.visitorId, credentials?.urlSlug, { credentials });
          await visitor.triggerParticle({
            name: process.env.PARTICLE_EFFECT_NAME_FOR_FINAL_CLUE || "Green Smoke",
            duration: 7,
          });
        }
        renderGetClueParticleEffects({ world, assetId, credentials })
          .then()
          .catch(() => console.error("Could not render particle effects for get clue"));
      }
    }

    return res.send({
      success: true,
      text: clue.text || "test clue text",
      imgUrl: clue.imgUrl || "",
      contentImgUrl: clue.contentImgUrl || "",
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
      theme,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};

async function renderGetClueParticleEffects({ world, assetId, credentials }) {
  const droppedAsset = await DroppedAsset.get(assetId, credentials?.urlSlug, { credentials });
  await world.triggerParticle({
    name: process.env.PARTICLE_EFFECT_NAME_FOR_GET_CLUE || "Flame",
    duration: 3,
    position: {
      x: droppedAsset?.position?.x,
      y: droppedAsset?.position?.y,
    },
  });
}
