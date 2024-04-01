import { Request, Response } from "express";
import { DataObjectType } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleGetConfiguration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials;

    const { dataObject } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { challenge, clues, theme } = dataObject as DataObjectType;

    return res.json({ success: true, clues, challenge, theme });
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
