export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_THEME = "SET_THEME";
export const SET_IS_ADMIN = "SET_IS_ADMIN";
export const SET_ERROR = "SET_ERROR";
export const SET_CHALLENGE = "SET_CHALLENGE";
export const SET_CONFIG = "SET_CONFIG";
export const SET_CLUES = "SET_CLUES";
export const SET_PROGRESS = "SET_PROGRESS";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export type QuestionTypeOption = "text" | "multiple_choice" | "all_that_apply";

export type ClueType = {
  id: string;
  imgUrl: string;
  contentUrl: string;
  mediaType: "image" | "video" | "website";
  linkBehavior: "modal" | "drawer" | "tab";
  text: string;
};

export type EmoteType = {
  id: string;
  name: string;
  previewUrl: string;
};

export type BadgeType = {
  id: string;
  icon: string;
  description?: string;
  name: string;
};

export type VisitorInventoryType = {
  badges: { [name: string]: BadgeType };
};

export type LeaderboardEntryType = {
  name: string;
  cluesCollected: number;
  challengeDone: boolean;
  profileId: string;
};

export type ChallengeType = {
  imgUrl?: string;
  title?: string;
  text?: string;
  answer?: string;
  selectedEmote?: string;
  lastUpdated?: string;
  questionType?: QuestionTypeOption;
  options?: { [key: string]: string };
  correctAnswers?: string[];
};

export interface InitialState {
  hasInteractiveParams?: boolean;
  hasSetupBackend?: boolean;
  profileId?: string;
  theme?: string;
  isAdmin?: boolean;
  error?: string;
  badges?: { [name: string]: BadgeType };
  challenge?: ChallengeType;
  clues?: { [id: string]: ClueType };
  emotes?: EmoteType[];
  cluesFound?: number;
  totalClues?: number;
  hasCompletedClues?: boolean;
  hasCompletedChallenge?: boolean;
  visitorInventory?: VisitorInventoryType;
  leaderboard?: LeaderboardEntryType[];
}

export type ActionType = {
  type: string;
  payload?: Partial<InitialState>;
};

export interface ThemeInfo {
  title: string;
  challengeTitleImgUrl: string;
  numberOfAssetsAvailableInAdminSection?: number;
}

export interface ThemeData {
  [key: string]: ThemeInfo;
}
