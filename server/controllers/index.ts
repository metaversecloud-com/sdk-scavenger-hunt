import { Asset, AssetFactory, DroppedAssetFactory, VisitorFactory, WorldFactory } from "@rtsdk/topia";
import { credentialsFromQuery } from "../utils/credsFromQuery.js";
import myTopiaInstance from "../utils/topiaInstance.js";
import { getDroppedAssetByNameFromSceneDropId, extractImageURL, getProfile } from "../utils/common.js";
import { Credentials } from "../utils/types.js";

// export async function initialAppState(req, res) {
//   // get visitor admin status
//   // get dataObject

//   const credentials = credentialsFromQuery(req);
//   const visitor = await new VisitorFactory(myTopiaInstance).get(parseInt(credentials.visitorId), credentials.urlSlug, {
//     credentials,
//   });

//   console.log("this is the current visitor", visitor);

//   const mainAsset = await new DroppedAssetFactory(myTopiaInstance).get(credentials.assetId, credentials.urlSlug, {
//     credentials,
//   });

//   const { isAdmin } = visitor as any;

//   const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });
//   const rs = await world.fetchSceneDropIds();
// }

// function studentProgressGen() {
//   const fullDatObject = [];
//   for (let i = 0; i < 500; i++) {
//     const studentProgress = {
//       studentId: i,
//       progress: Math.floor(Math.random() * 100),
//     };
//     fullDatObject.push(studentProgress);
//   }

//   return fullDatObject;
// }

async function asssetDisplayData(credentials, id) {
  const mainAsset = await new DroppedAssetFactory(myTopiaInstance).get(id, credentials.urlSlug, {
    credentials,
  });
  const { topLayerURL, dataObject } = mainAsset as any;
  const url = extractImageURL(topLayerURL);
  return {
    text: dataObject.scavengerHunt.text,
    image: dataObject.scavengerHunt.image,
    answer: dataObject.scavengerHunt.answer || null,
    assetImage: url,
  };
}

export async function loadClueWithId(req, res) {
  const credentials = credentialsFromQuery(req);
  const clueId = req.params.id;
  try {
    const mainAsset = await new DroppedAssetFactory(myTopiaInstance).get(clueId, credentials.urlSlug, {
      credentials,
    });

    const { bottomLayerURL, dataObject } = mainAsset as any;

    let assetImage = bottomLayerURL.split("https%3A//") || "";
    if (assetImage.length > 1) {
      assetImage = assetImage[1].split("?")[0];
    }

    res.send({
      text: dataObject.scavengerHunt.text,
      image: dataObject.scavengerHunt.image,
      assetImage,
    });
  } catch (error) {
    console.error(error);
  }
}

export async function loadClue(req, res) {
  const credentials = credentialsFromQuery(req);

  try {

    const assetsList = await getDroppedAssetByNameFromSceneDropId(
      ["Web Image Asset", "scavengerHuntChallenge"],
      credentials,
    );

    const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
    const challengeAsset = assetsList.find((a) => a.name === "scavengerHuntChallenge").assets;

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

    const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(challengeAsset[0].id, credentials.urlSlug, {
      credentials,
    });

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

export async function loadChallenge(req, res) {
  const credentials = credentialsFromQuery(req);
  // await asssetDisplayData(credentials, credentials.assetId);

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
      ["Web Image Asset", "scavengerHuntChallenge"],
      credentials,
    );

    const webImageAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;
    const challengeAsset = assetsList.find((a) => a.name === "scavengerHuntChallenge").assets[0];

    // const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });
    // const { sceneDropIds } = (await world.fetchSceneDropIds()) as any;

    // // console.log("these are the scene ids", sceneDropIds);
    // const r = (await world.fetchDroppedAssetsBySceneDropId({ sceneDropId: sceneDropIds[0] })) as any;
    // const clueAssets = r.filter((a) => a.assetName === "Web Image Asset");
    const { isAdmin, profileId, username } = await getProfile(credentials);

    const student = analytics.progress.find((s) => s.studentId === profileId);
    const hasCompletedClues = student ? student.cluesFound.length === webImageAssets.length : false;

    res.json({ challenge, hasCompletedClues, hasCompletedChallenge: student ? student.challengeDone : false });
  } catch (error) {
    res.json({});
  }
}

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

    const assetsList = await getDroppedAssetByNameFromSceneDropId(
      ["treeImage"],
      credentials,
    );

    const { position } = assetsList.find((a) => a.name === "treeImage").assets[0];

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

export async function loadAnalytics(req, res) {
  const credentials = credentialsFromQuery(req);

  const assetsList = await getDroppedAssetByNameFromSceneDropId(["Web Image Asset"], credentials);

  // const world = new WorldFactory(myTopiaInstance).create(credentials.urlSlug, { credentials });
  // const { sceneDropIds } = (await world.fetchSceneDropIds()) as any;

  // // console.log("these are the scene ids", sceneDropIds);
  // const r = (await world.fetchDroppedAssetsBySceneDropId({ sceneDropId: sceneDropIds[0] })) as any;
  const clueAssets = assetsList.find((a) => a.name === "Web Image Asset").assets;

  const { dataObject } = (await new DroppedAssetFactory(myTopiaInstance).get(credentials.assetId, credentials.urlSlug, {
    credentials,
  })) as any;

  res.json({
    totalClues: clueAssets.length,
    analytics: dataObject.analytics,
  });
}

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

export async function updateClue(req, res) {
  const credentials = credentialsFromQuery(req);
  const { assetId, imageURL, text, image } = req.body;

  const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(assetId, credentials.urlSlug, {
    credentials,
  });

  await writeObject.updateWebImageLayers(image, image);
  await writeObject.updateDataObject({
    scavengerHunt: {
      text,
      image: imageURL,
    },
  });

  res.json({
    scavengerHunt: {
      text,
      imageURL,
    },
  });
}

export async function updateChallenge(req, res) {
  const credentials = credentialsFromQuery(req);
  const { text, answer } = req.body;

  const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(credentials.assetId, credentials.urlSlug, {
    credentials,
  });

  await writeObject.updateDataObject({
    ...writeObject.dataObject,
    challenge: {
      text,
      answer,
    },
  });

  res.json({
    scavengerHunt: {
      text,
      answer,
    },
  });
}
