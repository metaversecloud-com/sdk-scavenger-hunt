export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";

export type InteractiveParams = {
  assetId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export interface InitialState {
  profileId: string;
  hasInteractiveParams: boolean;
  hasSetupBackend: boolean;
}

export type ActionType = {
  type: string;
  payload?: any;
};
