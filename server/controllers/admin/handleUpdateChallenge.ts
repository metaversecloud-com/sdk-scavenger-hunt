import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials } from "../../utils";

export const handleUpdateChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { text, answer } = req.body;

    const keyAsset = await DroppedAsset.create(credentials.assetId, credentials.urlSlug, {
      credentials,
    });

    const lowerCaseAnswer = answer.toLowerCase();

    await keyAsset.updateDataObject({
      ...keyAsset.dataObject,
      challenge: {
        text,
        answer: lowerCaseAnswer,
      },
    });

    return res.json({ text, answer: lowerCaseAnswer });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateChallenge",
      message: "Error updating challenge.",
      req,
      res,
    });
  }
}
