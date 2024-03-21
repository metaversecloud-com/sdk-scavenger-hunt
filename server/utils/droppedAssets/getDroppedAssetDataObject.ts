
import { errorHandler } from "../errorHandler";
import { DroppedAsset } from "../topiaInit";
import { Credentials } from "../types";
import { initializeDroppedAssetDataObject } from "./initializeDroppedAssetDataObject";

export const getDroppedAssetDataObject = async (droppedAssetId: string, credentials: Credentials, isKeyAsset: boolean) => {
  try {
    const { urlSlug } = credentials;

    const droppedAsset = await DroppedAsset.get(droppedAssetId, urlSlug, { credentials });
    await initializeDroppedAssetDataObject(droppedAsset, isKeyAsset);

    return droppedAsset;
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAssetDataObject",
      message: "Error getting dropped asset data object",
    });
  }
};
