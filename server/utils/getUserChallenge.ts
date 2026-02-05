import { Credentials } from "../types.js";
import { standardizeError } from "./standardizeError.js";
import { Visitor } from "./topiaInit.js";

export const getUserChallenge = async (credentials: Credentials) => {
  try {
    const { sceneDropId, urlSlug, visitorId } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const dataObject = await visitor.fetchDataObject();

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    let payload = { challengeDone: false, cluesFound: [] };

    if (!dataObject) {
      await visitor.setDataObject(
        {
          [`${urlSlug}_${sceneDropId}`]: payload,
        },
        { lock: { lockId, releaseLock: true } },
      );
      return payload;
    } else if (dataObject[`${urlSlug}-${sceneDropId}`] && !dataObject[`${urlSlug}_${sceneDropId}`]) {
      // migrate old data format to new format
      payload = dataObject[`${urlSlug}-${sceneDropId}`];
      const data = visitor.dataObject;
      data[`${urlSlug}_${sceneDropId}`] = payload;
      delete data[`${urlSlug}-${sceneDropId}`];
      await visitor.updateDataObject(data, { lock: { lockId, releaseLock: true } });
      return payload;
    } else if (!dataObject[`${urlSlug}_${sceneDropId}`]) {
      await visitor.updateDataObject(
        { [`${urlSlug}_${sceneDropId}`]: payload },
        { lock: { lockId, releaseLock: true } },
      );
      return payload;
    }

    return visitor.dataObject[`${urlSlug}_${sceneDropId}`];
  } catch (error) {
    throw standardizeError(error);
  }
};
