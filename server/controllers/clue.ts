import { DroppedAssetFactory } from "@rtsdk/topia";
import { credentialsFromQuery } from "../utils/credsFromQuery.js";
import myTopiaInstance from "../utils/topiaInstance.js";
import { extractImageURL, getProfile, getDroppedAssetByNameFromSceneDropId } from "../utils/common.js";

export async function loadClue(req, res) {
  const credentials = credentialsFromQuery(req);

  try {
    const assetsList = await getDroppedAssetByNameFromSceneDropId(
      ["Web Image Asset", "National Parks Scavenger Hunt Sign"],
      credentials,
    );

    const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
    const challengeAsset = assetsList.find((a) => a.name === "National Parks Scavenger Hunt Sign").assets;

    const mainAsset = await new DroppedAssetFactory(myTopiaInstance).get(credentials.assetId, credentials.urlSlug, {
      credentials,
    });

    const { bottomLayerURL, dataObject } = mainAsset as any;

    const url = extractImageURL(bottomLayerURL);
    const { isAdmin, profileId, username } = await getProfile(credentials);

    const assetDropped = await new DroppedAssetFactory(myTopiaInstance).get(challengeAsset[0].id, credentials.urlSlug, {
      credentials,
    });

    const { analytics } = assetDropped.dataObject as any;

    // finding student in the array
    const student = analytics.progress.find((s) => s.studentId === profileId);

    if (student) {
      // check if cluesFound array includes the assetId
      const cluesFound = student.cluesFound.includes(credentials.assetId);
      if (!cluesFound) {
        student.cluesFound.push(credentials.assetId);
      }
    } else {
      analytics.progress.push({
        userName: username,
        studentId: profileId,
        cluesFound: [credentials.assetId],
        challegeDone: false,
      });
    }

    const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(
      challengeAsset[0].id,
      credentials.urlSlug,
      {
        credentials,
      },
    );

    await writeObject.updateDataObject({ ...writeObject.dataObject, analytics });

    res.send({
      text: dataObject.scavengerHunt.text,
      image: dataObject.scavengerHunt.image,
      assetImage: url,
      isAdmin,
      totalClues: clueAssets.length,
      cluesFound: student ? student.cluesFound.length : 0,
    });
  } catch (error) {
    console.error(error);
  }
}
