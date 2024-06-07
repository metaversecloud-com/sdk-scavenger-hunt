export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_THEME = "SET_THEME";

export type InteractiveParams = {
  assetId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  urlSlug: string;
  username: string;
  visitorId: string;
  identityId: string;
  displayName: string;
};

export interface InitialState {
  profileId: string;
  hasInteractiveParams: boolean;
  hasSetupBackend: boolean;
  theme: string;
}

export type ActionType = {
  type: string;
  payload?: any;
};

export interface ThemeInfo {
  title: string;
  correctAnswerCongratulations: string;
  challengeTitleImgUrl: string;
}

export interface ThemeData {
  [key: string]: ThemeInfo;
}
