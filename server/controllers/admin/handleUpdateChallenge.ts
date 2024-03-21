import { Request, Response } from "express";
import { DroppedAsset, errorHandler, getCredentials } from "../../utils";

export const handleUpdateChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { text, answer } = req.body;

    const writeObject = await DroppedAsset.create(credentials.assetId, credentials.urlSlug, {
      credentials,
    });

    const lowerCaseAnswer = answer.toLowerCase();

    await writeObject.updateDataObject({
      ...writeObject.dataObject,
      challenge: {
        text,
        answer: lowerCaseAnswer,
      },
    });

    res.json({
      scavengerHunt: {
        text,
        answer: lowerCaseAnswer,
      },
    });
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
