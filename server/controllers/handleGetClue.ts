import { Request, Response } from "express";
import { HuntConfigType, ClueType } from "../types.js";
import {
  awardBadge,
  errorHandler,
  getClueDroppedAssets,
  getConfig,
  getCredentials,
  getUserChallenge,
  getVisitorBadges,
  getVisitorProgress,
  updateLeaderboard,
} from "../utils/index.js";
import { DroppedAsset, Visitor } from "../utils/topiaInit.js";
import type { DroppedAssetInterface } from "@rtsdk/topia";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { keyAssetId, world, dataObject, keyAsset } = await getConfig({ credentials });
    const { theme } = dataObject as HuntConfigType;
    let clues = (dataObject as HuntConfigType).clues || {};

    // Three-layer lookup for the clicked clue:
    //   1. Fast path: the key-asset's `clues` map keyed by the current Topia assetId.
    //   2. Stale-id fallback: a half-stale map where the stored `clue.id` still matches
    //      the current Topia assetId, but the map's keys are from an older hunt.
    //   3. DA dataObject fallback: the scene was duplicated and everything stored is stale —
    //      the clue DA's own dataObject still carries the content; the `id` field there
    //      is also stale but we never need it (we just copy text/imgUrl/contentUrl/...).
    // On layers 2 or 3, we self-heal by re-deriving the whole clues map from the scene's
    // current clue dropped-assets and rewriting it onto the key asset. Subsequent clicks
    // hit the fast path, and completion tracking (which uses current Topia assetIds) stays
    // in sync with Object.keys(clues).length.
    let clue: ClueType | undefined = clues?.[assetId];
    let staleMap = false;

    if (!clue) {
      const byStoredId = Object.values(clues).find((c) => c?.id === assetId);
      if (byStoredId) {
        clue = { ...byStoredId, id: assetId };
        staleMap = true;
      }
    }

    if (!clue) {
      const droppedAsset = (await DroppedAsset.get(assetId, urlSlug, { credentials })) as DroppedAssetInterface;
      const daData = ((await droppedAsset.fetchDataObject()) || {}) as Partial<ClueType> & {
        isVideo?: boolean;
      };
      const hasContent = Boolean(daData.text || daData.contentUrl || daData.contentImgUrl || daData.imgUrl);
      if (hasContent) {
        clue = {
          id: assetId,
          imgUrl: daData.imgUrl || droppedAsset.topLayerURL || droppedAsset.bottomLayerURL || "",
          text: daData.text || "",
          contentUrl: daData.contentUrl || daData.contentImgUrl || "",
          mediaType: daData.mediaType || (daData.isVideo ? "video" : "image"),
          linkBehavior: daData.linkBehavior || "drawer",
        };
        staleMap = true;
      }
    }

    if (!clue) throw new Error(`No clue asset found.`);

    if (clue.isVideo === true && !clue.mediaType) clue.mediaType = "video";
    if (clue.contentImgUrl && !clue.contentUrl) clue.contentUrl = clue.contentImgUrl;

    // Self-heal: rebuild the clues map with current Topia IDs so subsequent reads hit
    // the fast path, and downstream completion tracking (Object.keys(clues).length)
    // reflects the real scene state. Best-effort — any failure is logged and swallowed.
    if (staleMap) {
      try {
        const freshClues = await getClueDroppedAssets({
          sceneDropId,
          uniqueName: `ScavengerHunt_${theme}_clue`,
          world,
        });
        if (Object.keys(freshClues).length > 0) {
          const lockId = `${sceneDropId}-heal-${new Date(Math.round(Date.now() / 60000) * 60000)}`;
          await keyAsset.updateDataObject({ clues: freshClues }, { lock: { lockId, releaseLock: true } });
          clues = freshClues;
          (dataObject as HuntConfigType).clues = freshClues;
          // Make sure the clue we're about to return reflects any content the fresh scan
          // picked up (e.g. an updated imgUrl on the DA) over the stale map entry.
          if (freshClues[assetId]) clue = { ...clue, ...freshClues[assetId] };
        }
      } catch (error) {
        errorHandler({ error, functionName: "handleGetClue", message: "Clues map self-heal failed" });
      }
    }

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
