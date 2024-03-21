import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleGetConfiguration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;
    let challenge = {};

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);

    const clues = await Promise.all(
      droppedAssets.map(async (asset) => {
        const { dataObject } = (await DroppedAsset.get(asset.id, urlSlug, {
          credentials,
        })) as any;

        if (dataObject.isKeyAsset || asset.uniqueName === "ScavengerHunt") {
            challenge = dataObject.challenge;
        } else {
          return {
            id: asset.id,
            name: asset.assetName,
            text: dataObject.text || "",
            imageUrl: dataObject.imageUrl || "",
          };
        }
      }),
    )
    .then(results => {
        return results.filter(result => result !== undefined);
    });
    
    return res.json({ clues, challenge });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleGetConfiguration",
      message: "Error loading configuration.",
      req,
      res,
    });
    return res.json({ clues: [] });
  }
};
