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

export type ClueType = {
  id: string;
  imageUrl: string;
  contentImgUrl: string;
  text: string;
};

export type DataObjectType = {
  sceneDropId: string;
  keyAssetId: string;
  buildableAssetUniqueName?: string;
  challenge: { answer: string; text: string; imageUrl: string };
  clues: {
    [id: string]: ClueType;
  };
  progress: {
    [profileId: string]: { challengeDone: boolean; cluesFound: string[]; profileId: string; username: string };
  };
};
