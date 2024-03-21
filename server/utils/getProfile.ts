import { Credentials } from "./types";
import { Visitor } from "./topiaInit";

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
