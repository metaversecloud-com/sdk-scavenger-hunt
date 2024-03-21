import { Asset, DroppedAsset } from "./topiaInit";
import { getDroppedAssetBySceneDropId } from "./droppedAssets/getDroppedAssetBySceneDropId";
import { errorHandler } from "./errorHandler";
import { getRandomPointInCircle } from "./getRandomPointInCircle";
import { Credentials } from "./types";

export async function dropLeaves(credentials: Credentials) {
  try {
    const dropZones = [
      {
        x: -354,
        y: -120,
      },
      {
        x: -297,
        y: -417,
      },
      {
        x: -25,
        y: -538,
      },
      {
        x: 219,
        y: -411,
      },
      {
        x: 325,
        y: -131,
      },
      {
        x: -5,
        y: -87,
      },
    ];

    const leafIds = ["pTGwDHbiqJfzc1lw7Xmu", "85gY9RrYh2llukwc3lr9", "C0qRlkJXqm8xGETLmjqE", "9RANIeC83o7yvcNjrGpO"];

    const assetsList = await getDroppedAssetBySceneDropId("National Parks Stamp", credentials);

    const { position } = assetsList.find((a) => a.name === "National Parks Stamp").assets[0];

    const leafAssetToPlace = Math.floor(Math.random() * leafIds.length);
    const newAsset = await Asset.create(leafIds[leafAssetToPlace], { credentials });

    const random = Math.floor(Math.random() * dropZones.length);
    const centralPosition = { x: position.x + dropZones[random].x, y: position.y + dropZones[random].y };

    const newPosition = getRandomPointInCircle(centralPosition.x, centralPosition.y, 140);

    await DroppedAsset.drop(newAsset, {
      interactivePublicKey: credentials.interactivePublicKey,
      position: newPosition,
      urlSlug: credentials.urlSlug,
    });

    return { success: true };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getDroppedAsset",
      message: "Error getting dropped asset",
    });
  }
}
