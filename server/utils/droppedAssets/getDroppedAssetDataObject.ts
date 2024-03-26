import { errorHandler } from "../errorHandler";
import { DroppedAsset } from "../topiaInit";
import { Credentials } from "../types";
import { initializeDroppedAssetDataObject } from "./initializeDroppedAssetDataObject";

export const getDroppedAssetDataObject = async ({
  droppedAssetId,
  credentials,
  isKeyAsset,
}: {
  droppedAssetId: string;
  credentials: Credentials;
  isKeyAsset: boolean;
}) => {
  const { urlSlug } = credentials;

  const droppedAsset = await DroppedAsset.get(droppedAssetId, urlSlug, { credentials });
  await initializeDroppedAssetDataObject(droppedAsset, isKeyAsset);

  return droppedAsset;
};
