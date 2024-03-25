import { Request, Response } from "express";
import { errorHandler, getCredentials, getDroppedAssetBySceneDropId, getDroppedAssetDataObject } from "../../utils";
import { World, DroppedAsset } from "../../utils/topiaInit";
import { WorldDataObject } from "../../utils/types";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId } = credentials;
    let cluesFound = 1,
      keyAssetId;

    const world = await World.create(credentials.urlSlug, { credentials });
    await world.fetchDataObject();

    const WorldDataObject = world.dataObject as WorldDataObject;

    if (!world.dataObject?.scavengerHunt) {
      world.dataObject.scavengerHunt = {};
    }

    const { bottomLayerURL, dataObject } = (world.dataObject as any).scavengerHunt;

    const student = dataObject.
    .progress[profileId];

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

    return res.send({
      text: clue.dataObject.text || "",
      imageUrl: clue.dataObject.imageUrl || "",
      keyAssetImage: bottomLayerURL,
      totalClues: Object.keys(droppedAssets).length - 1,
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
