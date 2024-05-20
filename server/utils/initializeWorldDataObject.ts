// @ts-nocheck
import { Credentials } from "../types.js";
import { errorHandler } from "./errorHandler.js";
import { getClueDroppedAssets } from "./getClueDroppedAssets.js";
import { DroppedAsset } from "./topiaInit.js";

export const initializeWorldDataObject = async ({
  credentials,
  sceneDropId,
  world,
}: {
  credentials: Credentials;
  sceneDropId: string;
  world: any;
}) => {
  try {
    const payload = {
      sceneDropId,
      buildableAssetUniqueName: "",
      challenge: {
        answer: "",
        text: "",
        imgUrl: "",
      },
      clues: {},
      progress: {},
    };

    if (!world.dataObject?.scenes || !world.dataObject?.scenes?.[sceneDropId]) {
      const droppedAsset = await DroppedAsset.get(credentials?.assetId, world.urlSlug, {
        credentials,
      });
      await droppedAsset.fetchDataObject();

      const challenge = droppedAsset.dataObject?.challenge;
      if (challenge) {
        const { answer, text } = challenge;
        payload.challenge = { answer, text };
      }

      payload.theme = droppedAsset?.dataObject?.theme;
      payload.challenge.imgUrl = `https://sdk-scavenger-hunt.s3.amazonaws.com/${droppedAsset?.dataObject?.theme}/IMG_Start.png`;
      payload.clues = await getClueDroppedAssets({
        uniqueName: `ScavengerHunt_${droppedAsset?.dataObject?.theme}_clue`,
        world,
      });
    }

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || !world.dataObject?.scenes) {
      await world.setDataObject(
        {
          scenes: {
            [sceneDropId]: {
              ...payload,
            },
          },
        },
        { lock: { lockId, releaseLock: true } },
      );
    } else if (!world.dataObject?.scenes?.[sceneDropId]) {
      await world.updateDataObject(
        {
          [`scenes.${sceneDropId}`]: { ...payload },
        },
        { lock: { lockId, releaseLock: true } },
      );
    }

    return;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeWorldDataObject",
      message: "Error initializing world data object",
    });
  }
};
