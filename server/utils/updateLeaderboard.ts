import { Credentials } from "../types.js";
import { standardizeError } from "./standardizeError.js";
import { DroppedAsset } from "./topiaInit.js";

export const updateLeaderboard = async ({
  credentials,
  keyAssetId,
  cluesCount,
  challengeDone,
  answerAttempts,
}: {
  credentials: Credentials;
  keyAssetId: string;
  cluesCount: number;
  challengeDone: boolean;
  answerAttempts: number;
}): Promise<void | Error> => {
  try {
    const { displayName, profileId, urlSlug } = credentials;

    const keyAsset = await DroppedAsset.create(keyAssetId, urlSlug, {
      credentials: { ...credentials, assetId: keyAssetId },
    });
    await keyAsset.fetchDataObject();
    const resultString = `${displayName}|${cluesCount}|${challengeDone}|${answerAttempts}`;

    if ((keyAsset.dataObject as { leaderboard?: Record<string, string> })?.leaderboard) {
      await keyAsset.updateDataObject(
        {
          [`leaderboard.${profileId}`]: resultString,
        },
        {},
      );
    } else {
      await keyAsset.updateDataObject(
        {
          leaderboard: {
            [`${profileId}`]: resultString,
          },
        },
        {},
      );
    }
  } catch (error) {
    throw standardizeError(error);
  }
};
