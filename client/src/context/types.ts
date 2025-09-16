export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_THEME = "SET_THEME";
export const SET_IS_ADMIN = "SET_IS_ADMIN";
export const SET_ERROR = "SET_ERROR";

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

export interface InitialState {
  hasInteractiveParams?: boolean;
  hasSetupBackend?: boolean;
  profileId?: string;
  theme?: string;
  isAdmin?: boolean;
  error?: string;
}

export type ActionType = {
  type: string;
  payload?: InitialState;
};

export interface ThemeInfo {
  title: string;
  challengeTitleImgUrl: string;
  numberOfAssetsAvailableInAdminSection?: number;
}

export interface ThemeData {
  [key: string]: ThemeInfo;
}

export type ClueType = {
  id: string;
  imgUrl: string;
  contentUrl: string;
  mediaType: "image" | "video" | "website";
  linkBehavior: "modal" | "drawer" | "tab";
  text: string;
};
