import { Request, Response } from "express";
import { DataObjectType, ClueType } from "../types";
import { errorHandler, getCredentials, getWorldDataObject } from "../utils";

export const handleResetGame = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, profileId, sceneDropId, username } = credentials;

    const { world } = await getWorldDataObject({ credentials, sceneDropId });

    await world.updateDataObject({
      scenes: {
        "9lpbrujPyvdDlw8Q9lEL-1711383307095": {
          buildableAssetUniqueName: "",
          totalGamesWonCount: 0,
          challenge: {
            imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_Start.png",
            text: "What is the color of the sky?",
            answer: "blue",
          },
          keyAssetId: "-NtqODEUwsYTqgUaYQyB",
          sceneDropId: "9lpbrujPyvdDlw8Q9lEL-1711383307095",
          progress: {},
          clues: {
            "-Ntwby-06Z1csHOZfw-4": {
              contentImgUrl:
                "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/655464fe420b715a6fdcd924_download%2520(14)-p-800.png",
              imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_1.png",
              id: "-Ntwby-06Z1csHOZfw-4",
              text: "Clue 1",
            },
            "-Nu-JgCMjBwk7kvsld6d": {
              contentImgUrl:
                "https://assets-global.website-files.com/6536cb67a381b2b8c0317b9a/65546505c732cb3fd47036ad_download%2520(15)-p-800.png",
              imageUrl: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_5.png",
              id: "-Nu-JgCMjBwk7kvsld6d",
              text: "Clue 2",
            },
          },
        },
      },
    });

    return res.send({
      success: true,
    });
  } catch (error) {
    errorHandler({
      error,
      functionName: "handleResetGame",
      message: "Error reset game.",
      req,
      res,
    });
  }
};
