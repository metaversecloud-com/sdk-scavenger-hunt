import { Request, Response } from "express";
import {
  DroppedAsset,
  errorHandler,
  getClueDroppedAssets,
  getCredentials,
  getWorldDataObject,
  Asset,
  Visitor,
} from "../utils/index.js";
import { ClueType, WorldDataObjectType } from "../types.js";
import { DroppedAssetInterface, VisitorInterface } from "@rtsdk/topia";

export const handleAddNewClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId, urlSlug, visitorId } = credentials;

    const protocol = process.env.INSTANCE_PROTOCOL;
    const host = req.hostname;
    let BASE_URL = `${protocol}://${host}`;
    if (host === "localhost") BASE_URL = "http://localhost:3001";

    const visitor: VisitorInterface = await Visitor.get(visitorId, urlSlug, { credentials });

    const getWorldDataObjectResult = await getWorldDataObject({ credentials });
    if (getWorldDataObjectResult instanceof Error) throw getWorldDataObjectResult;
    const { world, dataObject } = getWorldDataObjectResult;

    const { clues, theme } = dataObject as WorldDataObjectType;

    const keyAsset: DroppedAssetInterface = await DroppedAsset.get(assetId, urlSlug, { credentials });

    const { moveTo } = visitor;
    const position = {
      x: moveTo.x + 100,
      y: moveTo.y,
    };
    const uniqueName = `ScavengerHunt_${theme}_clue`;

    const asset = await Asset.create(process.env.IMG_ASSET_ID || "webImageAsset", { credentials });

    const spawnedDroppedAsset: DroppedAssetInterface = await DroppedAsset.drop(asset, {
      clickableLink: `${BASE_URL}/clue`,
      clickableLinkTitle: "Scavenger Hunt",
      clickableDisplayTextDescription: "Scavenger Hunt",
      clickableDisplayTextHeadline: "Scavenger Hunt",
      isOpenLinkInDrawer: true,
      position,
      uniqueName,
      urlSlug,
      isInteractive: true,
      sceneDropId,
      interactivePublicKey: process.env.INTERACTIVE_KEY,
    });

    const clueData: ClueType = {
      id: spawnedDroppedAsset.id,
      imgUrl: "",
      text: `Clue ${Object.keys(clues).length + 1}`,
      contentUrl: "",
      mediaType: "image",
      linkBehavior: "drawer",
    };
    clues[spawnedDroppedAsset.id] = clueData;

    await spawnedDroppedAsset.setDataObject(clueData, {});

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject(
      { [`scenes.${sceneDropId}.clues.${spawnedDroppedAsset.id}`]: clueData },
      { lock: { lockId, releaseLock: true } },
    );

    return res.json({ success: true, clues });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleAddNewClue",
      message: "Error adding new clue.",
      req,
      res,
    });
  }
};
