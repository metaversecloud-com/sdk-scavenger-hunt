import { errorHandler } from "./errorHandler.js";

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

    const droppedAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId, uniqueName });

    for (const droppedAsset of droppedAssets) {
      const dataObject = await droppedAsset.fetchDataObject();
      const { contentUrl, openInModal, isVideo, contentImgUrl, mediaType, linkBehavior, imgUrl, text } = dataObject;
      clues[droppedAsset.id] = {
        id: droppedAsset.id,
        imgUrl: imgUrl || droppedAsset.topLayerURL || droppedAsset.bottomLayerURL,
        text: text || `Clue ${Object.keys(clues).length + 1}`,
        contentUrl,
        openInModal,
        isVideo,
        contentImgUrl,
        mediaType,
        linkBehavior,
      };
    }

    return clues;
  } catch (error) {
    errorHandler({
      error,
      functionName: "resetClues",
      message: "Error resetting clues on world data object",
    });
  }
};
