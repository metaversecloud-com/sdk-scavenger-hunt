import { Credentials } from "../types";
import { errorHandler } from "./errorHandler";
import { Visitor } from "./topiaInit";

export const getUserChallenge = async (credentials: Credentials) => {
  try {
    const { sceneDropId, urlSlug, visitorId } = credentials;

    const visitor = await Visitor.create(visitorId, urlSlug, { credentials });
    const dataObject = await visitor.fetchDataObject();

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    const payload = { challengeDone: false, cluesFound: [] };

    if (!dataObject) {
      await visitor.setDataObject(
        {
          [`${urlSlug}-${sceneDropId}`]: payload,
        },
        { lock: { lockId, releaseLock: true } },
      );
      return payload;
    } else if (!dataObject[`${urlSlug}-${sceneDropId}`]) {
      await visitor.updateDataObject(
        { [`${urlSlug}-${sceneDropId}`]: payload },
        { lock: { lockId, releaseLock: true } },
      );
      return payload;
    }

    return visitor.dataObject[`${urlSlug}-${sceneDropId}`];
  } catch (error) {
    return errorHandler({
      error,
      functionName: "getUserChallenge",
      message: "Error getting user challenge data.",
    });
  }
};
