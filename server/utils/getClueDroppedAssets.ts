import { errorHandler } from "./errorHandler.js";

export const getClueDroppedAssets = async ({ uniqueName, world }: { uniqueName: string; world: any }) => {
  try {
    const clues = {};

    const droppedAssets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName });
    await droppedAssets?.[0]?.fetchDataObject();
    for (const index in droppedAssets) {
      clues[droppedAssets[index].id] = {
        id: droppedAssets[index].id,
        imgUrl: droppedAssets[index].topLayerURL || droppedAssets[index].bottomLayerURL,
        text: droppedAssets?.[0]?.dataObject?.clues?.[index]?.text || `Clue ${parseInt(index) + 1}`,
        contentUrl:
          droppedAssets?.[0]?.dataObject?.clues?.[index]?.contentUrl ||
          droppedAssets?.[0]?.dataObject?.clues?.[index]?.contentImgUrl,
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
