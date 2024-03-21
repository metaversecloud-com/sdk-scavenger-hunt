import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials } from "../../utils";

export const handleLoadClueWithId = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const clueId = req.params.id;
    
    const mainAsset = await DroppedAsset.get(clueId, credentials.urlSlug, {
      credentials,
    });

    const { bottomLayerURL, dataObject } = mainAsset as any;

    let assetImage = bottomLayerURL.split("https%3A//") || "";
    if (assetImage.length > 1) assetImage = assetImage[1].split("?")[0];

    res.send({
      text: dataObject.scavengerHunt.text,
      image: dataObject.scavengerHunt.image,
      assetImage,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleLoadClueWithId",
      message: "Error loading clue with Id.",
      req,
      res,
    });
  }
}
