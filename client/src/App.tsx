import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";

// pages
import { Home, Clue, Error } from "./pages";

// context
import { GlobalDispatchContext } from "./context/GlobalContext";
import { InteractiveParams, SET_HAS_SETUP_BACKEND, SET_INTERACTIVE_PARAMS } from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";

import "./App.css";
import "./index.css";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInteractiveParams, setHasInteractiveParams] = useState(false);
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams: InteractiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId") || "",
      displayName: searchParams.get("displayName") || "",
      identityId: searchParams.get("identityId") || "",
      interactiveNonce: searchParams.get("interactiveNonce") || "",
      interactivePublicKey: searchParams.get("interactivePublicKey") || "",
      profileId: searchParams.get("profileId") || "",
      sceneDropId: searchParams.get("sceneDropId") || "",
      uniqueName: searchParams.get("uniqueName") || "",
      urlSlug: searchParams.get("urlSlug") || "",
      username: searchParams.get("username") || "",
      visitorId: searchParams.get("visitorId") || "",
    };
  }, [searchParams]);

  const setInteractiveParams = useCallback(
    ({ profileId }: InteractiveParams) => {
      dispatch!({
        type: SET_INTERACTIVE_PARAMS,
        payload: { profileId },
      });
    },
    [dispatch],
  );

  const setHasSetupBackend = useCallback(
    (success: boolean) => {
      dispatch!({
        type: SET_HAS_SETUP_BACKEND,
        payload: { hasSetupBackend: success },
      });
    },
    [dispatch],
  );

  const setupBackend = async () => {
    const setupResponse = await setupBackendAPI(interactiveParams);
    setHasSetupBackend(setupResponse.success);
    if (!setupResponse.success) navigate("*");
    else setHasInitBackendAPI(true);
  };

  useEffect(() => {
    if (interactiveParams.assetId) {
      setInteractiveParams({
        ...interactiveParams,
      });
      setHasInteractiveParams(true);
    }
  }, [interactiveParams, setInteractiveParams]);

  useEffect(() => {
    if (!hasInitBackendAPI && hasInteractiveParams) setupBackend();
  }, [hasInitBackendAPI, hasInteractiveParams]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="challenge" element={<Home />} />
      <Route path="clue" element={<Clue />} />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
