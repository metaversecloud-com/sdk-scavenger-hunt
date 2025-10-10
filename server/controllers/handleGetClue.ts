import { Request, Response } from "express";
import { WorldDataObjectType, ClueType } from "../types.js";
import { errorHandler, getCredentials, getUserChallenge, getWorldDataObject } from "../utils/index.js";
import { DroppedAsset, Visitor } from "../utils/topiaInit.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, urlSlug, visitorId } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials });
    const { clues, theme } = dataObject as WorldDataObjectType;

    const clue: ClueType = clues?.[assetId];
    if (!clue) throw new Error(`No clue asset found.`);

    if (clue.isVideo === true && !clue.mediaType) clue.mediaType = "video";
    if (clue.contentImgUrl && !clue.contentUrl) clue.contentUrl = clue.contentImgUrl;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const userChallenge = await getUserChallenge(credentials);

    let cluesFound = [];

    if (!userChallenge) {
      await visitor.updateDataObject(
        {
          [`${urlSlug}-${sceneDropId}`]: { challengeDone: false, cluesFound: [] },
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
    } else {
      if (userChallenge.cluesFound) cluesFound = userChallenge.cluesFound;
      if (!cluesFound?.includes(assetId)) {
        cluesFound = [...cluesFound, assetId];
        await visitor.updateDataObject(
          {
            [`${urlSlug}-${sceneDropId}.cluesFound`]: cluesFound,
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

    return res.send({
      ...clue,
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
      theme,
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
