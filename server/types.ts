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

// Per-scene index entry stored at the TOP LEVEL of the world's data object —
// mirrors the sdk-quiz pattern. Everything else (theme, challenge, clues,
// buildableAssetUniqueName) now lives on the key asset's data object.
//
//   world.dataObject = { [sceneDropId]: WorldSceneIndexType, ... }
export type WorldSceneIndexType = {
  keyAssetId: string;
};

// Canonical shape of the key asset's data object.
export type KeyAssetDataObjectType = {
  theme?: string;
  challenge?: ChallengeType;
  buildableAssetUniqueName?: string;
  clues?: { [id: string]: ClueType };
  leaderboard?: Record<string, string>;
};

// Convenience shape returned by `getConfig` — the merged view of
// "everything callers used to read from `scenes.{sceneDropId}`". After the
// move, this is sourced almost entirely from the key asset's data object,
// with a legacy fallback to world's `scenes.{sceneDropId}` for un-migrated
// worlds.
export type WorldDataObjectType = {
  sceneDropId: string;
  keyAssetId: string;
  buildableAssetUniqueName?: string;
  theme?: string;
  challenge: ChallengeType;
  clues: {
    [id: string]: ClueType;
  };
  progress?: {}; // legacy
};

export interface Expression {
  id: string;
  name: string;
  expressionImage?: string;
  type: string;
}
