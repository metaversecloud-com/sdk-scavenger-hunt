import { Asset, DroppedAsset } from "./topiaInit";
import { errorHandler } from "./errorHandler";
import { getRandomPointInCircle } from "./getRandomPointInCircle";
import { Credentials } from "../types";

export async function dropLeaves({ buildableAssetUniqueName, credentials, sceneDropId }: { buildableAssetUniqueName: string, credentials: Credentials, sceneDropId: string }) {
  try {
    const { interactivePublicKey, urlSlug } = credentials
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

    const droppedAsset = await DroppedAsset.getWithUniqueName(buildableAssetUniqueName, urlSlug, {
      interactivePublicKey,
      interactiveSecret: process.env.INTERACTIVE_SECRET,
    });

    const leafUrls = process.env["DROPPABLE_ASSETS"].split(",")
    const index = Math.floor(Math.random() * leafUrls.length);

    const random = Math.floor(Math.random() * dropZones.length);
    const centralPosition = { x: droppedAsset.position.x + dropZones[random].x, y: droppedAsset.position.y + dropZones[random].y };
    const position = getRandomPointInCircle(centralPosition.x, centralPosition.y, 140);

    const asset = Asset.create(process.env.WEB_IMAGE_ASSET_ID || "webImageAsset", {
      credentials,
    });

    await DroppedAsset.drop(asset, {
      layer1: leafUrls[index],
      position,
      sceneDropId,
      urlSlug,
    });

    return { success: true };
  } catch (error) {
    return errorHandler({
      error,
      functionName: "dropLeaves",
      message: "Error dropping leaf asset",
    });
  }
}
