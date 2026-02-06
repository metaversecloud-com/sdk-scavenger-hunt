import { Request, Response } from "express";
import { WorldDataObjectType, ClueType } from "../types.js";
import {
  awardBadge,
  errorHandler,
  getCredentials,
  getUserChallenge,
  getVisitorBadges,
  getVisitorProgress,
  getWorldDataObject,
  updateLeaderboard,
} from "../utils/index.js";
import { DroppedAsset, Visitor } from "../utils/topiaInit.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { keyAssetId, world, dataObject } = await getWorldDataObject({ credentials });
    const { clues, theme } = dataObject as WorldDataObjectType;

    const clue: ClueType = clues?.[assetId];
    if (!clue) throw new Error(`No clue asset found.`);

    if (clue.isVideo === true && !clue.mediaType) clue.mediaType = "video";
    if (clue.contentImgUrl && !clue.contentUrl) clue.contentUrl = clue.contentImgUrl;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const visitorInventory = await getVisitorBadges(visitor);

    const userChallenge = await getUserChallenge(credentials);

    let cluesFound = [];
    let isNewClue = false;

    if (!userChallenge) {
      await visitor.updateDataObject(
        {
          [`${urlSlug}_${sceneDropId}`]: { challengeDone: false, cluesFound: [] },
        },
        {
          analytics: [
            { analyticName: `${theme}-starts`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `starts`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `${theme}-cluesFound1`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `cluesFound1`, uniqueKey: profileId, profileId, urlSlug },
          ],
        },
      );
      cluesFound = [assetId];
      isNewClue = true;
    } else {
      if (userChallenge.cluesFound) cluesFound = userChallenge.cluesFound;
      if (!cluesFound?.includes(assetId)) {
        cluesFound = [...cluesFound, assetId];
        isNewClue = true;
        await visitor.updateDataObject(
          {
            [`${urlSlug}_${sceneDropId}.cluesFound`]: cluesFound,
          },
          {
            analytics: [
              { analyticName: `${theme}-cluesFound${cluesFound.length}`, uniqueKey: profileId, profileId, urlSlug },
              { analyticName: `cluesFound${cluesFound.length}`, uniqueKey: profileId, profileId, urlSlug },
            ],
          },
        );

        if (cluesFound.length === Object.keys(dataObject.clues).length) {
          visitor
            .triggerParticle({
              name: "partyPopper_float",
              duration: 7,
            })
            .catch((error) =>
              errorHandler({
                error,
                functionName: "handleGetClue",
                message: "Error triggering particle effects",
              }),
            );
        }

        const droppedAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });
        world
          .triggerParticle({
            name: "disco_float",
            duration: 3,
            position: {
              x: droppedAsset?.position?.x,
              y: droppedAsset?.position?.y,
            },
          })
          .catch((error) =>
            errorHandler({
              error,
              functionName: "handleGetClue",
              message: "Error triggering particle effects",
            }),
          );
      }
    }

    // Award badges if a new clue was collected
    let updatedVisitorInventory = visitorInventory;
    if (isNewClue) {
      // Re-fetch visitor data object to get updated state
      await visitor.fetchDataObject();
      const progress = getVisitorProgress(visitor.dataObject);

      let badgeAwarded = false;

      // "Spark of Discovery" - First clue ever collected
      if (progress.totalCluesCollected === 1 || !visitorInventory.badges["Spark of Discovery"]) {
        const result = await awardBadge({
          credentials,
          visitor,
          visitorInventory,
          badgeName: "Spark of Discovery",
        });
        if (result.awarded) badgeAwarded = true;
      }

      // "Traveler" - Collect clues in 3 different worlds
      if (progress.uniqueWorlds.length >= 3) {
        const result = await awardBadge({
          credentials,
          visitor,
          visitorInventory,
          badgeName: "Traveler",
        });
        if (result.awarded) badgeAwarded = true;
      }

      // "Scout" - Collect 25 total clues across all scavenger hunts
      if (progress.totalCluesCollected >= 25) {
        const result = await awardBadge({
          credentials,
          visitor,
          visitorInventory,
          badgeName: "Scout",
        });
        if (result.awarded) badgeAwarded = true;
      }

      // Re-fetch inventory if a badge was awarded
      if (badgeAwarded) {
        updatedVisitorInventory = await getVisitorBadges(visitor);
      }
    }

    // Update leaderboard with current progress
    await updateLeaderboard({
      credentials,
      keyAssetId,
      cluesCount: cluesFound.length,
      challengeDone: userChallenge?.challengeDone || false,
      answerAttempts: userChallenge?.answerAttempts || 0,
    });

    return res.send({
      ...clue,
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
      theme,
      visitorInventory: updatedVisitorInventory,
    });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
