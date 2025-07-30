export interface Credentials {
  assetId: string;
  displayName: string;
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
  imgUrl: string;
  contentImgUrl: string;
  isVideo: boolean;
  linkBehavior: "modal" | "drawer" | "tab";
  text: string;
};

export type DataObjectType = {
  sceneDropId: string;
  keyAssetId: string;
  buildableAssetUniqueName?: string;
  theme?: string;
  challenge: { answer: string; text: string; imgUrl: string; selectedEmote?: string };
  clues: {
    [id: string]: ClueType;
  };
  progress: {
    [profileId: string]: { challengeDone: boolean; cluesFound: string[]; profileId: string; username: string };
  };
};

export type DroppedAssetType = {
  position?: { x?: number; y?: number };
};

export interface Expression {
  id: string;
  name: string;
  expressionImage?: string;
  type: string;
}
