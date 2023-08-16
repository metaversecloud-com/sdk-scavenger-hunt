import { Credentials } from "./types.js";

export const credentialsFromQuery = (req: any): Credentials => {
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId", "assetId"];
  const { query } = req;
  const missingFields = requiredFields.filter((variable) => !query[variable]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required query parameters: ${missingFields.join(", ")}`);
  }

  return {
    interactiveNonce: query.interactiveNonce as string,
    interactivePublicKey: query.interactivePublicKey as string,
    urlSlug: query.urlSlug as string,
    visitorId: query.visitorId as string,
    assetId: query.assetId as string,
  };
};

