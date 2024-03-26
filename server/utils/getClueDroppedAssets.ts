import { errorHandler } from "./errorHandler";

export const getClueDroppedAssets = async ({ uniqueName, world }: { uniqueName: string, world: any }) => {
  try {
    const clues = {}

    const droppedAssets = await world.fetchDroppedAssetsWithUniqueName({ uniqueName })
    for (const index in droppedAssets) {
      clues[droppedAssets[index].id] = {
        id: droppedAssets[index].id,
        imageUrl: droppedAssets[index].topLayerURL || droppedAssets[index].bottomLayerURL,
        text: `Clue ${parseInt(index) + 1}`,
      }
    }

    return clues
  } catch (error) {
    errorHandler({
      error,
      functionName: "resetClues",
      message: "Error resetting clues on world data object",
    });
    return await world.fetchDataObject();
  }
};