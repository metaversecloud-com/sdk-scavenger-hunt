import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleLoadConfiguration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug } = credentials;
    let challenge = {}, keyAssetId;
    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);

    const assets = await Promise.all(
      droppedAssets.map(async (asset) => {
        const { dataObject } = (await DroppedAsset.get(asset.id, urlSlug, {
          credentials,
        })) as any;

        if (dataObject.isKeyAsset) {
            keyAssetId = asset.id;
        } else {
          let assetImage = asset.bottomLayerURL.split("https%3A//") || "";
          if (assetImage.length > 1) assetImage = assetImage[1].split("?")[0];

          return {
            id: asset.id,
            name: asset.assetName,
            assetImage: `https://${assetImage}`,
            clueText: dataObject.scavengerHunt ? dataObject.scavengerHunt.text : "",
            clueImage: dataObject.scavengerHunt ? dataObject.scavengerHunt.image : "",
          };
        }
      }),
    )
    .then(results => {
        return results.filter(result => result !== undefined);
    });
    
    if (keyAssetId) {
      const { dataObject } = await getDroppedAssetDataObject(keyAssetId, credentials, true);
      challenge = dataObject.challenge;
    }
    res.json({ clues: assets, challenge });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleLoadConfiguration",
      message: "Error loading configuration.",
      req,
      res,
    });
    return res.json({ clues: [] });
  }
};
