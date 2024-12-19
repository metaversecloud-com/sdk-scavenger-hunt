import { ActionType, InitialState, SET_HAS_SETUP_BACKEND, SET_INTERACTIVE_PARAMS, SET_THEME } from "./types";

const globalReducer = (state: InitialState, action: ActionType) => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        profileId: payload?.profileId,
        hasInteractiveParams: true,
      };
    case SET_HAS_SETUP_BACKEND:
      return {
        ...state,
        ...payload,
        hasSetupBackend: true,
      };
    case SET_THEME: {
      return {
        ...state,
        ...payload,
        theme: payload?.theme,
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
