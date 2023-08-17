import { DroppedAssetFactory } from "@rtsdk/topia";
import { credentialsFromQuery } from "../../utils/credsFromQuery.js";
import myTopiaInstance from "../../utils/topiaInstance.js";

export async function updateChallenge(req, res) {
    const credentials = credentialsFromQuery(req);
    const { text, answer } = req.body;
  
    const writeObject = await new DroppedAssetFactory(myTopiaInstance).create(credentials.assetId, credentials.urlSlug, {
      credentials,
    });
    
    const lowerCaseAnswer = answer.toLowerCase();

    await writeObject.updateDataObject({
      ...writeObject.dataObject,
      challenge: {
        text,
        answer: lowerCaseAnswer,
      },
    });
  
    res.json({
      scavengerHunt: {
        text,
        answer: lowerCaseAnswer,
      },
    });
  }
  