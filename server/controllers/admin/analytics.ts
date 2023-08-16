import { DroppedAssetFactory } from "@rtsdk/topia";
import { getDroppedAssetByNameFromSceneDropId } from "../../utils/common.js";
import { credentialsFromQuery } from "../../utils/credsFromQuery.js";
import myTopiaInstance from "../../utils/topiaInstance.js";

export async function loadAnalytics(req, res) {
    const credentials = credentialsFromQuery(req);
  
    const assetsList = await getDroppedAssetByNameFromSceneDropId(["Web Image Asset"], credentials);
    const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
  
    const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(credentials.assetId, credentials.urlSlug, {
      credentials,
    })) as any;
  
    res.json({
      totalClues: clueAssets.length,
      analytics: dataObject.analytics,
    });
  }