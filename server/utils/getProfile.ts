import { VisitorInterface } from "@rtsdk/topia";
import { Credentials } from "../types.js";
import { Visitor } from "./topiaInit.js";

export const getProfile = async (credentials: Credentials) => {
  try {
    const visitor: VisitorInterface = await Visitor.get(credentials.visitorId, credentials.urlSlug, { credentials });

    return { isAdmin: visitor.isAdmin };
  } catch (error) {
    console.error("getProfile: error", error);
    return {};
  }
};
