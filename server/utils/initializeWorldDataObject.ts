// @ts-nocheck
import { Credentials } from "../types";
import { errorHandler } from "./errorHandler";
import { getClueDroppedAssets } from "./getClueDroppedAssets";
import { DroppedAsset } from "./topiaInit";

export const initializeWorldDataObject = async ({
  credentials,
  keyAssetId,
  sceneDropId,
  world,
}: {
  credentials: Credentials;
  keyAssetId: string;
  sceneDropId: string;
  world: any;
}) => {
  try {
    await world.fetchDataObject();

    const payload = {
      sceneDropId,
      keyAssetId,
      buildableAssetUniqueName: "",
      challenge: { answer: "", text: "", imageUrl: "" },
      clues: {},
      progress: {},
    };

    if (!world.dataObject?.scenes || !world.dataObject?.scenes?.[sceneDropId]) {
      if (keyAssetId) {
        const keyAsset = await DroppedAsset.get(keyAssetId, world.urlSlug, { credentials });
        payload.challenge.imageUrl = keyAsset.topLayerURL;
        payload.clues = await getClueDroppedAssets({ uniqueName: `${keyAsset.uniqueName}_clue`, world });
      }
    }

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || !world.dataObject?.scenes) {
      await world.setDataObject(
        {
          scenes: {
            [sceneDropId]: { ...payload },
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
    return await world.fetchDataObject();
  }
};
