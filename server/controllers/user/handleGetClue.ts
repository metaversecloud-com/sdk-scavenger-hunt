import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;
    let keyAssetId;

    const droppedAssets = await getDroppedAssetBySceneDropId(sceneDropId || "Web Image Asset", credentials);

    await droppedAssets.map(async (asset) => {
      if (asset.uniqueName === "ScavengerHunt") keyAssetId = asset.id;
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
    } else {
      await keyAsset.updateDataObject({ [`analytics.progress.${profileId}.cluesFound.${assetId}`]: true });
    }

    const clue = await getDroppedAssetDataObject(assetId, credentials, false);

    console.log("🚀 ~ file: handleGetClue.ts:42 ~ Object.keys(student.cluesFound).length:", Object.keys(student.cluesFound).length)
    return res.send({
      text: clue.dataObject.text || "",
      image: clue.dataObject.image || "",
      keyAssetImage: bottomLayerURL,
      totalClues: Object.keys(droppedAssets).length - 1,
      cluesFound: student?.cluesFound ? Object.keys(student.cluesFound).length : 1,
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
