import { errorHandler } from "./errorHandler";
import { DroppedAsset, World } from "./topiaInit";
import { Credentials } from "./types";
import { initializeDroppedAssetDataObject } from "./droppedAssets/initializeDroppedAssetDataObject";

export const getWorldAndDataObject = async ({ credentials }: { credentials: Credentials }) => {
  try {
    const { urlSlug } = credentials;

    const world = await World.create(urlSlug, { credentials });
    await world.fetchDataObject();

    return world;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getWorldAndDataObject",
      message: "Error getting world and world data object",
    });
  }
};
