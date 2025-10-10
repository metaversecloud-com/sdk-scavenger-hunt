import { DroppedAssetInterface } from "@rtsdk/topia";
import { Credentials, KeyAssetDataObjectType, WorldDataObjectType } from "../types.js";
import { errorHandler } from "./errorHandler.js";
import { getClueDroppedAssets } from "./getClueDroppedAssets.js";
import { DroppedAsset } from "./topiaInit.js";

export const initializeWorldDataObject = async ({ credentials, world }: { credentials: Credentials; world: any }) => {
  try {
    const { assetId, sceneDropId, uniqueName, urlSlug } = credentials;

    await world.fetchDataObject();

    if (world.dataObject?.scenes?.[sceneDropId]) return world.dataObject;

    let keyAssetId, keyAsset, keyAssetDataObject;

    if (uniqueName === "ScavengerHunt") {
      keyAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
      keyAssetDataObject = (await keyAsset.fetchDataObject()) as KeyAssetDataObjectType;
    } else {
      const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({
        sceneDropId,
        uniqueName: "ScavengerHunt",
      });
      if (droppedAssets.length === 0) throw "No key asset found with unique name 'ScavengerHunt' in this scene.";

      const keyAsset = droppedAssets.find((asset) => asset.uniqueName === "ScavengerHunt");
      keyAssetId = keyAsset.id;
      keyAssetDataObject = (await keyAsset.fetchDataObject()) as KeyAssetDataObjectType;
    }

    const { challenge, theme } = keyAssetDataObject;

    if (!theme) throw "Key asset is missing required theme in it's data object.";

    const clues = await getClueDroppedAssets({
      sceneDropId,
      uniqueName: `ScavengerHunt_${theme}_clue`,
      world,
    });

    const payload: WorldDataObjectType = {
      keyAssetId,
      sceneDropId,
      buildableAssetUniqueName: "",
      clues,
      challenge: challenge
        ? challenge
        : {
            answer: "",
            text: "This challenge hasn't been set up yet. Please check back later.",
            imgUrl: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_Start.png`,
          },
      theme,
    };

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!world.dataObject || !world.dataObject?.scenes) {
      await world.setDataObject({ scenes: { [sceneDropId]: { ...payload } } }, { lock: { lockId, releaseLock: true } });
    } else if (!world.dataObject?.scenes?.[sceneDropId]) {
      await world.updateDataObject(
        { [`scenes.${sceneDropId}`]: { ...payload } },
        { lock: { lockId, releaseLock: true } },
      );
    }

    await world.fetchDataObject();

    return world.dataObject;
  } catch (error) {
    errorHandler({
      error,
      functionName: "initializeWorldDataObject",
      message: "Error initializing world data object",
    });
  }
};
