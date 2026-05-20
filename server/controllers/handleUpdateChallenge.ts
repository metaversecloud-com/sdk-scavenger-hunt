import { Request, Response } from "express";
import { errorHandler, getCredentials, getConfig } from "../utils/index.js";

// Challenge config + buildableAssetUniqueName now live on the **key asset's**
// data object (canonical). Legacy world-level `scenes.{sceneDropId}.challenge`
// values still work via the read-side overlay in `getConfig`, but
// every new save lands here on the key asset.
export const handleUpdateChallenge = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { profileId, urlSlug } = credentials;
    const {
      answer,
      buildableAssetUniqueName,
      imgUrl,
      title,
      text,
      selectedEmote,
      questionType,
      options,
      correctAnswers,
    } = req.body;

    const { keyAsset } = await getConfig({ credentials });

    const lowerCaseAnswer = answer ? answer.toLowerCase() : undefined;

    await keyAsset.updateDataObject(
      {
        "challenge.answer": lowerCaseAnswer,
        "challenge.imgUrl": imgUrl,
        "challenge.title": title,
        "challenge.text": text,
        "challenge.selectedEmote": selectedEmote,
        "challenge.questionType": questionType,
        "challenge.options": options,
        "challenge.correctAnswers": correctAnswers,
        "challenge.lastUpdated": new Date().toISOString(),
        buildableAssetUniqueName,
      },
      { analytics: [{ analyticName: `challengeUpdates`, uniqueKey: profileId, profileId, urlSlug }] },
    );

    return res.json({ success: true });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleUpdateChallenge",
      message: "Error updating challenge.",
      req,
      res,
    });
  }
};
