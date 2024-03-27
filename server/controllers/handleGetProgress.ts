import { Request, Response } from "express";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils";
import { DataObjectType } from '../types';

export const handleGetProgress = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId } = credentials

    const { dataObject } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { clues, progress } = dataObject as DataObjectType;

    return res.json({
      totalClues: Object.keys(clues).length || 0,
      progress,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetProgress",
      message: "Error loading progress.",
      req,
      res,
    });
  }
};
