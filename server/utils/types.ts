export interface Credentials {
  assetId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  username: string;
  urlSlug: string;
  visitorId: number;
}

export interface WorldDataObject {
  scavengerHunt?: {
    bottomLayerURL?: string;
  };
}
