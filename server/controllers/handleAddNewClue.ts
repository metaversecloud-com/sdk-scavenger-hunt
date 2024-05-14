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
import { DataObjectType } from "../types.js";

let BASE_URL;

export const handleAddNewClue = async (req: Request, res: Response) => {
  try {
    const credentials = getCredentials(req.query);
    const { assetId, sceneDropId, urlSlug, visitorId } = credentials;

    const protocol = process.env.INSTANCE_PROTOCOL;
    const host = req.hostname;
    const port = req.socket.localPort;
    [];

    if (host === "localhost") {
      BASE_URL = "http://localhost:3001";
    } else {
      BASE_URL = `${protocol}://${host}`;
    }

    const visitor = await Visitor.get(visitorId, urlSlug, { credentials });

    const { world, dataObject } = await getWorldDataObject({ credentials, keyAssetId: assetId, sceneDropId });
    const { theme } = dataObject as DataObjectType;

    const keyAsset = await DroppedAsset.get(assetId, urlSlug, { credentials });

    await dropImageAsset({ urlSlug, credentials, visitor, theme, keyAsset });

    // @ts-ignore
    const clues = await getClueDroppedAssets({ uniqueName: `${keyAsset.uniqueName}_${theme}_clue`, world });

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    await world.updateDataObject({ [`scenes.${sceneDropId}.clues`]: clues }, { lock: { lockId, releaseLock: true } });

    return res.json({ success: true, clues });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleResetClues",
      message: "Error resetting clues.",
      req,
      res,
    });
  }
};

async function dropImageAsset({
  urlSlug,
  credentials,
  visitor,
  theme,
  keyAsset,
}: {
  urlSlug: any;
  credentials: any;
  visitor: any;
  theme: any;
  keyAsset: any;
}) {
  const imgUrlLayer0 = null;
  const imgUrlLayer1 = null;

  const { moveTo, username } = visitor;
  const { x, y } = moveTo;
  const position = {
    x: x + 100,
    y: y,
  };
  const uniqueName = `ScavengerHunt_${theme}_clue`;

  const asset = await Asset.create(process.env.IMG_ASSET_ID, { credentials });

  let spawnedDroppedAsset;
  try {
    spawnedDroppedAsset = await DroppedAsset.drop(asset, {
      position,
      uniqueName,
      urlSlug,
      isInteractive: true,
      sceneDropId: keyAsset.sceneDropId,
      interactivePublicKey: process.env.INTERACTIVE_KEY,
      layer0: imgUrlLayer0,
      layer1: imgUrlLayer1,
    });
  } catch (error) {
    // This solves a bug where the asset is not dropped in the world for legacy assets with outdated urls from the old version.
    await visitor?.closeIframe(credentials?.assetId);
  }

  await Promise.all([
    spawnedDroppedAsset?.updateDataObject({
      profileId: visitor?.profileId,
    }),
    spawnedDroppedAsset?.updateClickType({
      clickType: "link",
      clickableLink: `${BASE_URL}/clue`,
      clickableLinkTitle: "Scavenger Hunt",
      clickableDisplayTextDescription: "Scavenger Hunt",
      clickableDisplayTextHeadline: "Scavenger Hunt",
      isOpenLinkInDrawer: true,
    }),
  ]);

  await spawnedDroppedAsset.setDataObject(keyAsset?.dataObject);

  return spawnedDroppedAsset;
}
