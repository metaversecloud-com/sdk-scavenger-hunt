import { errorHandler } from "./errorHandler.js";
import { initializeWorldDataObject } from "./initializeWorldDataObject.js";
import { World } from "./topiaInit.js";
import { Credentials } from "../types.js";
import { WorldDataObjectType } from "../types.js";

type WorldDataObject = {
  scenes: {
    [key: string]: WorldDataObjectType;
  };
};

export const getWorldDataObject = async ({
  credentials,
  sceneDropId,
}: {
  credentials: Credentials;
  sceneDropId: string;
}) => {
  try {
    const { urlSlug } = credentials;

    const world = World.create(urlSlug, { credentials });
    await world.fetchDataObject();
    await initializeWorldDataObject({ credentials, sceneDropId, world });

    let dataObject = world.dataObject as WorldDataObject;

    if (!dataObject?.scenes?.[sceneDropId]) {
      await world.fetchDataObject();
      dataObject = world.dataObject as WorldDataObject;
    }

    // remove profile from all scenes in data object to clean up legacy data
    let shouldUpdate = false;
    Object.keys(dataObject.scenes).forEach((key) => {
      if (dataObject.scenes[key].progress) {
        delete dataObject.scenes[key].progress;
        shouldUpdate = true;
      }
    });
    if (shouldUpdate) await world.updateDataObject(dataObject);

    return { dataObject: dataObject.scenes[sceneDropId], world };
  } catch (error) {
    return errorHandler({ error, functionName: "getWorldDataObject", message: "Error getting world details" });
  }
};
