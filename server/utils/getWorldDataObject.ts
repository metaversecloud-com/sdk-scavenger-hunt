import { errorHandler } from "./errorHandler.js";
import { DroppedAsset, World } from "./topiaInit.js";
import { Credentials, KeyAssetDataObjectType, WorldDataObjectType } from "../types.js";
import { DroppedAssetInterface, WorldInterface } from "@rtsdk/topia";
import { getClueDroppedAssets } from "./getClueDroppedAssets.js";

interface IWorld extends WorldInterface {
  dataObject: {
    scenes: {
      [sceneDropId: string]: WorldDataObjectType;
    };
  };
}

export const getWorldDataObject = async ({ credentials }: { credentials: Credentials }) => {
  try {
    const { assetId, sceneDropId, uniqueName, urlSlug } = credentials;

    const world = (await World.create(urlSlug, { credentials })) as IWorld;
    await world.fetchDataObject();

    if (!world.dataObject?.scenes?.[sceneDropId]) {
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
      if (!world.dataObject?.scenes) {
        await world.setDataObject(
          { scenes: { [sceneDropId]: { ...payload } } },
          { lock: { lockId, releaseLock: true } },
        );
      } else if (!world.dataObject?.scenes?.[sceneDropId]) {
        await world.updateDataObject(
          { [`scenes.${sceneDropId}`]: { ...payload } },
          { lock: { lockId, releaseLock: true } },
        );
      }

      await world.fetchDataObject();
    } else {
      // remove profile from all scenes in data object to clean up legacy data
      let shouldUpdate = false;
      Object.keys(world.dataObject.scenes).forEach((key) => {
        if (world.dataObject.scenes[key].progress) {
          delete world.dataObject.scenes[key].progress;
          shouldUpdate = true;
        }
      });
      if (shouldUpdate) await world.updateDataObject(world.dataObject, {});
    }

    return { dataObject: world.dataObject.scenes[sceneDropId], world };
  } catch (error) {
    return errorHandler({ error, functionName: "getWorldDataObject", message: "Error getting world details" });
  }
};
