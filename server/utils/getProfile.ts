import { Credentials } from "../types.js";
import { Visitor } from "./topiaInit.js";

export const getProfile = async (credentials: Credentials) => {
  try {
    const visitor = await Visitor.get(credentials.visitorId, credentials.urlSlug, {
      credentials,
    });

    const { isAdmin } = visitor as any;

    return { isAdmin };
  } catch (error) {
    console.error("getProfile: error", error);
    return {};
  }
};
