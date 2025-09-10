import { Request, Response } from "express";
import { WorldDataObjectType, Expression } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject, Visitor } from "../utils/index.js";

export const handleGetConfiguration = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { sceneDropId, urlSlug, visitorId } = credentials;

    const { dataObject } = await getWorldDataObject({ credentials, sceneDropId });
    const { challenge, clues, theme } = dataObject as WorldDataObjectType;

    for (const clueId in clues) {
      if (clues[clueId].isVideo === true && !clues[clueId].mediaType) clues[clueId].mediaType = "video";
      if (clues[clueId].contentImgUrl && !clues[clueId].contentUrl)
        clues[clueId].contentUrl = clues[clueId].contentImgUrl;
    }

    const visitor = Visitor.create(visitorId, urlSlug, { credentials });
    const availableExpressions = (await visitor.getExpressions({ getUnlockablesOnly: true })) as Expression[];

    const emotes = availableExpressions.map((expression) => ({
      id: expression.id,
      name: expression.name,
      type: expression.type,
      previewUrl: expression.expressionImage,
    }));

    return res.json({ clues, challenge, emotes, theme });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetConfiguration",
      message: "Error loading configuration.",
      req,
      res,
    });
  }
};
