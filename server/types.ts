export interface Credentials {
  assetId: string;
  displayName: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  username: string;
  urlSlug: string;
  visitorId: number;
}

export type ClueType = {
  id: string;
  imgUrl: string;
  contentImgUrl?: string; // legacy, replaced by contentUrl
  contentUrl: string;
  isVideo?: boolean; // legacy, replaced by mediaType
  mediaType: "image" | "video" | "website";
  linkBehavior: "modal" | "drawer" | "tab";
  text: string;
};

export type QuestionTypeOption = "text" | "multiple_choice" | "all_that_apply";

export type ChallengeType = {
  answer?: string;
  text: string;
  imgUrl: string;
  selectedEmote?: string;
  questionType?: QuestionTypeOption;
  options?: { [key: string]: string };
  correctAnswers?: string[];
};

export type WorldDataObjectType = {
  sceneDropId: string;
  keyAssetId: string;
  buildableAssetUniqueName?: string;
  theme?: string;
  challenge: ChallengeType;
  clues: {
    [id: string]: ClueType;
  };
  progress?: {}; // legacy, should be removed moving forward in getWorldDataObject
};

export type KeyAssetDataObjectType = {
  theme?: string;
  challenge?: ChallengeType;
};

export interface Expression {
  id: string;
  name: string;
  expressionImage?: string;
  type: string;
}
