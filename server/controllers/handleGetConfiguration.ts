import { Request, Response } from "express";
import { DataObjectType } from "../types";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils";

export const handleGetConfiguration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials;

    const { dataObject } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { challenge, clues } = dataObject as DataObjectType;

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
