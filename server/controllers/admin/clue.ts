import { DroppedAssetFactory } from "@rtsdk/topia";
import { credentialsFromQuery } from "../../utils/credsFromQuery.js";
import myTopiaInstance from "../../utils/topiaInstance.js";

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
