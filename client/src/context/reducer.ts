import {
  ActionType,
  InitialState,
  SET_HAS_SETUP_BACKEND,
  SET_INTERACTIVE_PARAMS,
  SET_THEME,
  SET_IS_ADMIN,
  SET_ERROR,
  SET_CHALLENGE,
  SET_CONFIG,
  SET_CLUES,
  SET_PROGRESS,
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
        theme: payload?.theme,
        error: "",
      };
    }
    case SET_IS_ADMIN: {
      return {
        ...state,
        isAdmin: payload?.isAdmin,
        error: "",
      };
    }
    case SET_ERROR:
      return {
        ...state,
        error: payload?.error,
      };
    case SET_CHALLENGE: {
      return {
        ...state,
        challenge: payload?.challenge,
        error: "",
      };
    }
    case SET_CONFIG: {
      return {
        ...state,
        challenge: payload?.challenge ?? state.challenge,
        clues: payload?.clues ?? state.clues,
        emotes: payload?.emotes ?? state.emotes,
        theme: payload?.theme ?? state.theme,
        isAdmin: payload?.isAdmin ?? state.isAdmin,
        error: "",
      };
    }
    case SET_CLUES: {
      return {
        ...state,
        clues: payload?.clues ?? state.clues,
        error: "",
      };
    }
    case SET_PROGRESS: {
      return {
        ...state,
        cluesFound: payload?.cluesFound ?? state.cluesFound,
        totalClues: payload?.totalClues ?? state.totalClues,
        hasCompletedClues: payload?.hasCompletedClues ?? state.hasCompletedClues,
        hasCompletedChallenge: payload?.hasCompletedChallenge ?? state.hasCompletedChallenge,
        error: "",
      };
    }
    default: {
      throw new Error(`Unhandled action type: ${type}`);
    }
  }
};

export { globalReducer };
