import { errorHandler } from "./errorHandler.js";
import { initializeWorldDataObject } from "./initializeWorldDataObject.js";
import { World } from "./topiaInit.js";
import { Credentials } from "../types.js";
import { DataObjectType } from "../types";

type WorldDataObject = {
  scenes: {
    [key: string]: DataObjectType;
  };
};

export const getWorldDataObject = async ({
  credentials,
  keyAssetId,
  sceneDropId,
}: {
  credentials: Credentials;
  keyAssetId?: string;
  sceneDropId: string;
}) => {
  try {
    const { urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    // await initializeWorldDataObject({ credentials, keyAssetId, sceneDropId, world });

    const dataObject = world.dataObject as WorldDataObject;

    return { dataObject: dataObject.scenes[sceneDropId], world };
  } catch (error) {
    return errorHandler({ error, functionName: "getWorldDataObject", message: "Error getting world details" });
  }
};
