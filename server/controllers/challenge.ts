import { AssetFactory, DroppedAssetFactory, WorldFactory } from "@rtsdk/topia";
import { getDroppedAssetByNameFromSceneDropId, getProfile } from "../utils/common.js";
import { credentialsFromQuery } from "../utils/credsFromQuery.js";
import myTopiaInstance from "../utils/topiaInstance.js";
import { Credentials } from "../utils/types";

export async function answerChallenge(req, res) {
  try {
    const answer = req.body.answer;
    const credentials = credentialsFromQuery(req);
    const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(
      credentials.assetId,
      credentials.urlSlug,
      {
        credentials,
      },
    )) as any;

    const dt = new DroppedAssetFactory(myTopiaInstance);
    await dt.get(credentials.assetId, credentials.urlSlug, { credentials });
    await dt.create(credentials.assetId, credentials.urlSlug, { credentials });

    const { challenge, analytics } = dataObject;

    const isCorrect = challenge.answer === answer;

    if (!isCorrect) res.json({ isCorrect: false });

    const { isAdmin, profileId, username } = await getProfile(credentials);
    const student = analytics.progress.find((s) => s.studentId === profileId);

    student.challengeDone = true;

    const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(
      credentials.assetId,
      credentials.urlSlug,
      {
        credentials,
      },
    );

    await writeObject.updateDataObject({ analytics });
    await dropLeaves(credentials);
    res.json({ isCorrect: true });
  } catch (error) {
    console.error(error);
    res.json({ isCorrect: false });
  }
}

function getRandomPointInCircle(centerX, centerY, radius) {
  var angle = Math.random() * 2 * Math.PI;
  var randomRadius = Math.sqrt(Math.random()) * radius;
  var x = centerX + randomRadius * Math.cos(angle);
  var y = centerY + randomRadius * Math.sin(angle);
  return { x: x, y: y };
}

export async function dropLeaves(credentials: Credentials) {
  const dropZones = [
    {
      x: -354,
      y: -120,
    },
    {
      x: -297,
      y: -417,
    },
    {
      x: -25,
      y: -538,
    },
    {
      x: 219,
      y: -411,
    },
    {
      x: 325,
      y: -131,
    },
    {
      x: -5,
      y: -87,
    },
  ];

  const leafIds = ["UB1taPsgEd1v2DQ2n3ju", "4mQhBJSvmfqVCM4TRSeC", "ObZTPYJHo7BEWEEfKB2F", "tgcFjLbjqeEeQEzXVeO8"];

  try {
    const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });

    const assetsList = await getDroppedAssetByNameFromSceneDropId(["treeBG"], credentials);

    const { position } = assetsList.find((a) => a.name === "treeBG").assets[0];

    const leafAssetToPlace = Math.floor(Math.random() * leafIds.length);
    const newAsset = new AssetFactory(myTopiaInstance).create(leafIds[leafAssetToPlace], { credentials });

    const random = Math.floor(Math.random() * dropZones.length);
    const centralPosition = { x: position.x + dropZones[random].x, y: position.y + dropZones[random].y };

    const newPosition = getRandomPointInCircle(centralPosition.x, centralPosition.y, 140);

    const r = await new DroppedAssetFactory(myTopiaInstance).drop(newAsset, {
      interactivePublicKey: credentials.interactivePublicKey,
      position: newPosition,
      urlSlug: credentials.urlSlug,
    });
    // console.log(newPosition);
  } catch (error) {
    console.error(error);
  }
}

export async function loadChallenge(req, res) {
  const credentials = credentialsFromQuery(req);

  try {
    const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(
      credentials.assetId,
      credentials.urlSlug,
      {
        credentials,
      },
    )) as any;

    const { challenge, analytics } = dataObject;

    const assetsList = await getDroppedAssetByNameFromSceneDropId(
      ["Web Image Asset"],
      credentials,
    );

    const webImageAssets = assetsList[0].assets
    const { isAdmin, profileId } = await getProfile(credentials);

    const student = analytics.progress.find((s) => s.studentId === profileId);
    const hasCompletedClues = student ? student.cluesFound.length === webImageAssets.length : false;

    res.json({ challenge, hasCompletedClues, hasCompletedChallenge: student ? student.challengeDone : false, isAdmin });
  } catch (error) {
    console.error(error);
    res.json({});
  }
}
