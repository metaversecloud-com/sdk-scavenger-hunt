import { Request, Response } from "express";
import { errorHandler, getCredentials } from "../utils/index.js";
import { Visitor, DroppedAsset } from "../utils/topiaInit.js";
import { DroppedAssetType } from "../types.js";

export const handleMoveToClueAsset = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { urlSlug } = credentials;
    const { clue } = req.body;

    if (!clue?.id) {
      return res.status(400).send({ success: false, message: "The clue asset id is missing." });
    }

    const droppedAsset = (await DroppedAsset.get(clue.id, urlSlug, { credentials })) as DroppedAssetType;
    const visitor = await Visitor.get(credentials?.visitorId, credentials?.urlSlug, { credentials });

    if (!droppedAsset?.position) {
      return res.status(400).send({ success: false, message: "The clue asset was not found" });
    }

    await visitor.moveVisitor({ shouldTeleportVisitor: false, x: droppedAsset.position.x, y: droppedAsset.position.y });

    return res.send({
      success: true,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleMoveToClueAsset",
      message: "Error moving to clue.",
      req,
      res,
    });
  }
};
