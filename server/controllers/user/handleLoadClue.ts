import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  extractImageURL,
  getCredentials,
  getDroppedAssetBySceneDropId,
  getProfile,
} from "../../utils";

export const handleLoadClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, username, urlSlug } = credentials

    const assetsList = await getDroppedAssetBySceneDropId(
      "National Parks Scavenger Hunt Sign",
      credentials,
    );

    console.log("🚀 ~ file: handleLoadClue.ts:27 ~ assetsList:", assetsList)
    if(assetsList.length === 0) throw "No dropped assets found."

    const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
    const challengeAsset = assetsList.find((a) => a.name === "National Parks Scavenger Hunt Sign").assets;

    const mainAsset = await DroppedAsset.get(assetId, urlSlug, {
      credentials,
    });

    const { bottomLayerURL, dataObject } = mainAsset as any;

    const url = extractImageURL(bottomLayerURL);
    const { isAdmin } = await getProfile(credentials);

    const assetDropped = await DroppedAsset.get(challengeAsset[0].id, urlSlug, {
      credentials,
    });

    const { analytics } = assetDropped.dataObject as any;

    const student = analytics.progress[profileId];

    if (student) {
      // check if cluesFound array includes the assetId
      const cluesFound = student.cluesFound.includes(assetId);
      if (!cluesFound) student.cluesFound.push(assetId);
    } else {
      analytics.progress.push({
        username,
        profileId,
        cluesFound: [assetId],
        challengeDone: false,
      });
    }

    await assetDropped.updateDataObject({ ...assetDropped.dataObject, analytics });

    res.send({
      text: dataObject.scavengerHunt.text,
      image: dataObject.scavengerHunt.image,
      assetImage: url,
      isAdmin,
      totalClues: clueAssets.length,
      cluesFound: student ? student.cluesFound.length : 0,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
}
