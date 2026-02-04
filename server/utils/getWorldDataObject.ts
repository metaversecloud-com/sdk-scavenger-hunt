import { standardizeError } from "./standardizeError.js";
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

    let keyAssetId = world.dataObject?.scenes?.[sceneDropId]?.keyAssetId;
    let keyAsset: DroppedAssetInterface;

    if (!keyAssetId) {
      if (uniqueName === "ScavengerHunt") {
        keyAsset = await DroppedAsset.create(assetId, urlSlug, { credentials });
      } else {
        const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({
          sceneDropId,
        });

        keyAsset = droppedAssets.find((asset) => asset.uniqueName === "ScavengerHunt");
        if (droppedAssets.length === 0 || !keyAsset) {
          throw "No key asset found with unique name 'ScavengerHunt' in this scene.";
        }
      }

      keyAssetId = keyAsset.id;
      let payload = world.dataObject?.scenes?.[sceneDropId];

      if (!payload) {
        const keyAssetDataObject = (await keyAsset.fetchDataObject()) as KeyAssetDataObjectType;

        const { challenge, theme } = keyAssetDataObject;

        if (!theme) throw "Key asset is missing required theme in it's data object.";

        const getClueDroppedAssetsResult = await getClueDroppedAssets({
          sceneDropId,
          uniqueName: `ScavengerHunt_${theme}_clue`,
          world,
        });
        if (getClueDroppedAssetsResult instanceof Error) throw getClueDroppedAssetsResult;

        const clues = getClueDroppedAssetsResult;

        payload = {
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
      }

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
      } else {
        await world.updateDataObject(
          { [`scenes.${sceneDropId}.keyAssetId`]: keyAssetId },
          { lock: { lockId, releaseLock: true } },
        );
      }
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

    await world.fetchDataObject();

    return { keyAssetId, dataObject: world.dataObject.scenes[sceneDropId], world };
  } catch (error) {
    throw standardizeError(error);
  }
};
