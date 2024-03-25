import { errorHandler } from "../errorHandler";
import { World } from "../topiaInit";
import { Credentials } from "../types";

export const getDroppedAssetBySceneDropId = async (sceneDropId: string, credentials: Credentials) => {
  try {
    const world = await World.create(credentials.urlSlug, { credentials });
    const droppedAssets = await world.fetchDroppedAssetsBySceneDropId({ sceneDropId });
    return droppedAssets;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetBySceneDropId",
      message: "Error getting dropped assets by sceneDropId",
    });
  }
};
