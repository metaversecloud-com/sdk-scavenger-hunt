import {
  ActionType,
  InitialState,
  SET_HAS_SETUP_BACKEND,
  SET_INTERACTIVE_PARAMS,
  SET_THEME,
  SET_IS_ADMIN,
  SET_ERROR,
} from "./types";

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
        error: "",
      };
    }
    case SET_IS_ADMIN: {
      return {
        ...state,
        ...payload,
        theme: payload?.isAdmin,
        error: "",
      };
    }
    case SET_ERROR:
      return {
        ...state,
        error: payload?.error,
      };
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
