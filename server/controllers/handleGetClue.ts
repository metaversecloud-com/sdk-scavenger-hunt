import { Request, Response } from "express";
import { DataObjectType, ClueType } from "../types.js";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils/index.js";

export const handleGetClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;

    const { dataObject, world } = await getWorldDataObject({ credentials, sceneDropId });
    const { clues, progress, theme } = dataObject as DataObjectType;

    const clue: ClueType = clues?.[assetId];
    if (!clue) throw new Error(`No clue asset found.`);

    let cluesFound = [];

    // await world.updateDataObject({
    //   scenes: {
    //     "9lpbrujPyvdDlw8Q9lEL-1711383307095": {
    //       buildableAssetUniqueName: "",
    //       totalGamesWonCount: 0,
    //       challenge: {
    //         answer: "yes",
    //         imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/national-park/IMG_Start.png",
    //         text: "Is this the final question?",
    //       },
    //       keyAssetId: "-NtqODEUwsYTqgUaYQyB",
    //       sceneDropId: "9lpbrujPyvdDlw8Q9lEL-1711383307095",
    //       progress: {},
    //       clues: {
    //         "-Ntwby-06Z1csHOZfw-4": {
    //           contentImgUrl:
    //             "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/655464fe420b715a6fdcd924_download%2520(14)-p-800.png",
    //           imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/national-park/IMG_1.png",
    //           id: "-Ntwby-06Z1csHOZfw-4",
    //           text: "Clue 1",
    //         },
    //         "-Nu-JgCMjBwk7kvsld6d": {
    //           contentImgUrl:
    //             "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/65546505c732cb3fd47036ad_download%2520(15)-p-800.png",
    //           imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/national-park/IMG_5.png",
    //           id: "-Nu-JgCMjBwk7kvsld6d",
    //           text: "Clue 2",
    //         },
    //       },
    //     },
    //   },
    // });

    if (!progress[profileId]) {
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress`]: {
          [profileId]: { challengeDone: false, cluesFound: [assetId], profileId, username },
        },
      });
      cluesFound = [assetId];
    } else if (!progress[profileId].cluesFound.includes(assetId)) {
      cluesFound = progress[profileId].cluesFound;
      cluesFound.push(assetId);
      await world.updateDataObject({
        [`scenes.${sceneDropId}.progress.${profileId}.cluesFound`]: cluesFound,
      });
    } else {
      cluesFound = progress[profileId].cluesFound;
    }

    return res.send({
      success: true,
      text: clue.text || "test clue text",
      imageUrl: clue.imageUrl || "",
      contentImgUrl: clue.contentImgUrl || "",
      totalClues: Object.keys(clues).length,
      cluesFound: cluesFound.length,
      isAdmin: true,
      theme,
    });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleGetClue",
      message: "Error loading clue.",
      req,
      res,
    });
  }
};
