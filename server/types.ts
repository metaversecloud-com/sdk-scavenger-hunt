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

export type WorldDataObjectType = {
  sceneDropId: string;
  keyAssetId: string;
  buildableAssetUniqueName?: string;
  theme?: string;
  challenge: { answer: string; text: string; imgUrl: string; selectedEmote?: string };
  clues: {
    [id: string]: ClueType;
  };
  progress?: {}; // legacy, should be removed moving forward in getWorldDataObject
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
