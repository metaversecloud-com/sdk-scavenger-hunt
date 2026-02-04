import { DroppedAssetInterface } from "@rtsdk/topia";
import { standardizeError } from "./standardizeError.js";
import { ClueType } from "../types.js";

export const getClueDroppedAssets = async ({
  sceneDropId,
  uniqueName,
  world,
}: {
  sceneDropId: string;
  uniqueName: string;
  world: any;
}) => {
  try {
    const clues = {};

    const droppedAssets: DroppedAssetInterface[] = await world.fetchDroppedAssetsBySceneDropId({
      sceneDropId,
      uniqueName,
    });

    for (const droppedAsset of droppedAssets) {
      const dataObject = (await droppedAsset.fetchDataObject()) as ClueType;
      const { contentUrl, isVideo, contentImgUrl, mediaType, linkBehavior, imgUrl, text } = dataObject;

      const legacySupport =
        droppedAssets?.[0]?.dataObject && (droppedAssets[0].dataObject as { clues?: any[] }).clues
          ? (droppedAssets[0].dataObject as { clues?: any[] }).clues?.[Object.keys(clues).length]
          : undefined;

      clues[droppedAsset.id] = {
        id: droppedAsset.id,
        imgUrl: imgUrl || droppedAsset.topLayerURL || droppedAsset.bottomLayerURL,
        text: text || legacySupport?.text || `Clue ${Object.keys(clues).length + 1}`,
        contentUrl: contentUrl || contentImgUrl || legacySupport?.contentImgUrl,
        mediaType: mediaType || (isVideo ? "video" : "image"),
        linkBehavior,
      };
    }

    return clues;
  } catch (error) {
    return standardizeError(error);
  }
};
