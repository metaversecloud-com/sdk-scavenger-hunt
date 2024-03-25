import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;
    let cluesFound = 1,
      keyAssetId;

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId, credentials);

    await droppedAssets.map(async (asset) => {
      if (asset.uniqueName === "ScavengerHunt") {
        keyAssetId = asset.id;
      }
    });

    if (!keyAssetId) throw "No key asset found.";

    const keyAsset = await getDroppedAssetDataObject(keyAssetId, credentials, true);
    const { bottomLayerURL, dataObject } = keyAsset;

    const student = dataObject.analytics.progress[profileId];

    if (!student) {
      await keyAsset.updateDataObject({
        [`analytics.progress.${profileId}`]: { challengeDone: false, cluesFound: {} },
      });
    } else if (!student.cluesFound) {
      await keyAsset.updateDataObject({ [`analytics.progress.${profileId}.cluesFound`]: { [assetId]: true } });
    } else if (!student.cluesFound[assetId]) {
      await keyAsset.updateDataObject({ [`analytics.progress.${profileId}.cluesFound.${assetId}`]: true });
      cluesFound = Object.keys(student.cluesFound).length + 1;
    }

    const clue = await getDroppedAssetDataObject(assetId, credentials, false);

    cluesFound = Object.keys(student.cluesFound).length;

    return res.send({
      success: true,
      text: clue.dataObject.text || "test clue text",
      imageUrl: clue.dataObject.imageUrl || "",
      totalClues: Object.keys(droppedAssets).length - 4,
      cluesFound,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
