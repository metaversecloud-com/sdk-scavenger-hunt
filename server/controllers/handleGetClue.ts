import { Request, Response } from "express";
import { DataObjectType, ClueType } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";
import { DroppedAsset, Visitor } from "../utils/topiaInit.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username, urlSlug, visitorId } = credentials;
    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, progress, theme } = dataObject as DataObjectType;
    const clue: ClueType = clues?.[assetId];

    if (!clue) throw new Error(`No clue asset found.`);

    let cluesFound = [];

    if (!progress[profileId]) {
      await world.updateDataObject(
        {
          [`scenes.${sceneDropId}.progress.${profileId}`]: {
            challengeDone: false,
            cluesFound: [assetId],
            profileId,
            username,
          },
        },
        {
          analytics: [
            { analyticName: `${theme}-starts`, uniqueKey: profileId, profileId, urlSlug },
            { analyticName: `starts`, uniqueKey: profileId, profileId, urlSlug },
          ],
        },
      );
      cluesFound = [assetId];
    } else {
      cluesFound = progress[profileId].cluesFound;
      if (!cluesFound.includes(assetId)) {
        cluesFound = [...cluesFound, assetId];
        await world.updateDataObject({
          [`scenes.${sceneDropId}.progress.${profileId}.cluesFound`]: cluesFound,
        });

        if (cluesFound.length === Object.keys(dataObject.clues).length) {
          const visitor = Visitor.create(visitorId, urlSlug, { credentials });
          visitor
            .triggerParticle({
              name: "partyPopper_float",
              duration: 7,
            })
            .then()
            .catch((error) => JSON.stringify(error));
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
          .then()
          .catch((error) => JSON.stringify(error));
      }
    }

    return res.send({
      success: true,
      text: clue.text || "",
      imgUrl: clue.imgUrl || "",
      contentImgUrl: clue.contentImgUrl || "",
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
