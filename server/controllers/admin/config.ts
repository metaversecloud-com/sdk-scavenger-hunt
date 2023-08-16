import { DroppedAssetFactory } from "@rtsdk/topia";
import { getDroppedAssetByNameFromSceneDropId } from "../../utils/common.js";
import { credentialsFromQuery } from "../../utils/credsFromQuery.js";
import myTopiaInstance from "../../utils/topiaInstance.js";

export async function loadConfiguration(req, res) {
  const credentials = credentialsFromQuery(req);
  try {
    // const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });
    // const { sceneDropIds } = (await world.fetchSceneDropIds()) as any;

    // console.log("these are the scene ids", sceneDropIds)
    // const assetsList = (await world.fetchDroppedAssetsBySceneDropId({ sceneDropId: sceneDropIds[0] })) as any;

    const assetsList = await getDroppedAssetByNameFromSceneDropId(
      ["Web Image Asset", "scavengerHuntChallenge"],
      credentials,
    );

    const webImageAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
    const challengeAsset = assetsList.find((a) => a.name === "scavengerHuntChallenge").assets[0];

    const assets = await Promise.all(
      webImageAssets.map(async (asset) => {
        const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(asset.id, credentials.urlSlug, {
          credentials,
        })) as any;

        let assetImage = asset.bottomLayerURL.split("https%3A//") || "";

        if (assetImage.length > 1) {
          assetImage = assetImage[1].split("?")[0];
        }

        return {
          id: asset.id,
          name: asset.assetName,
          assetImage: `https://${assetImage}`,
          clueText: dataObject.scavengerHunt ? dataObject.scavengerHunt.text : "",
          clueImage: dataObject.scavengerHunt ? dataObject.scavengerHunt.image : "",
        };
      }),
    );

    const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(challengeAsset.id, credentials.urlSlug, {
      credentials,
    })) as any;

    res.json({ clues: assets, challenge: dataObject.challenge });
  } catch (error) {
    console.error(error);
    res.json({ clues: [] });
  }
}
