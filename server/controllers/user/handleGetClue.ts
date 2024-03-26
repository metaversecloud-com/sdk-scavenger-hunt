import { Request, Response } from "express";
import {
  errorHandler,
  getCredentials,
  getDroppedAssetBySceneDropId,
  getDroppedAssetDataObject,
  getWorldAndDataObject,
} from "../../utils";

const NUMBER_OF_ASSETS_TO_IGNORE_BECAUSE_THEY_ARE_SCENE_ASSETS = 4;

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug } = credentials;

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId, credentials);

    const keyAsset = droppedAssets.find((asset) => asset.uniqueName === "ScavengerHunt");
    if (!keyAsset) {
      throw new Error(`No key asset found in ${urlSlug}.`);
    }

    const keyAssetData = await getDroppedAssetDataObject({
      droppedAssetId: keyAsset.id,
      credentials,
      isKeyAsset: true,
    });

    const userProgress = keyAssetData.dataObject.analytics.progress[profileId] || [];

    if (!userProgress.includes(assetId)) {
      userProgress.push(assetId);
      await keyAssetData.updateDataObject({
        [`analytics.progress.${profileId}`]: userProgress,
      });
    }

    const cluesFound = userProgress.length;
    const clue = await getDroppedAssetDataObject({
      droppedAssetId: assetId,
      credentials,
      isKeyAsset: false,
    });

    return res.send({
      success: true,
      text: clue.dataObject.text || "test clue text",
      imageUrl: clue.dataObject.imageUrl || "",
      totalClues: droppedAssets.length - NUMBER_OF_ASSETS_TO_IGNORE_BECAUSE_THEY_ARE_SCENE_ASSETS,
      cluesFound,
      isAdmin: true,
    });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
