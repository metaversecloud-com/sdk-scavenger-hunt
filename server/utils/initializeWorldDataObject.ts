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
    if (world.dataObject?.scenes?.[sceneDropId]) return;

    const payload = {
      sceneDropId,
      buildableAssetUniqueName: "",

      clues: {},
      progress: {},
    };

    const droppedAsset = await DroppedAsset.get(credentials.assetId, world.urlSlug, { credentials });
    await droppedAsset.fetchDataObject();

    const { challenge, theme } = droppedAsset.dataObject;

    if (!theme) throw "Key asset is missing required theme in it's data object.";
    payload.theme = theme;

    if (challenge) {
      payload.challenge = challenge;
    } else {
      payload.challenge = {
        answer: "",
        text: "This challenge hasn't been set up yet. Please check back later.",
        imgUrl: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_Start.png`,
      };
    }

    payload.clues = await getClueDroppedAssets({
      uniqueName: `ScavengerHunt_${theme}_clue`,
      world,
    });

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || !world.dataObject?.scenes) {
      await world.setDataObject({ scenes: { [sceneDropId]: { ...payload } } }, { lock: { lockId, releaseLock: true } });
    } else if (!world.dataObject?.scenes?.[sceneDropId]) {
      await world.updateDataObject(
        { [`scenes.${sceneDropId}`]: { ...payload } },
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
