import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

// pages
import Clue from "./pages/Clue";
import Challenge from "./pages/Admin/Challenge";
import Admin from "./pages/Admin/Admin";
import Error from "./pages/Error";

// context
import { GlobalDispatchContext } from "./context/GlobalContext";
import {
  InteractiveParams,
  SET_HAS_SETUP_BACKEND,
  SET_INTERACTIVE_PARAMS,
} from "./context/types";

// utils
import { setupBackendAPI } from "./utils/backendAPI";

import "./index.css";

const App = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hasInitBackendAPI, setHasInitBackendAPI] = useState(false);

  const dispatch = useContext(GlobalDispatchContext);

  const interactiveParams: InteractiveParams = useMemo(() => {
    return {
      assetId: searchParams.get("assetId") || "",
      interactiveNonce: searchParams.get("interactiveNonce") || "",
      interactivePublicKey: searchParams.get("interactivePublicKey") || "",
      profileId: searchParams.get("profileId") || "",
      sceneDropId: searchParams.get("sceneDropId") || "",
      urlSlug: searchParams.get("urlSlug") || "",
      username: searchParams.get("username") || "",
      visitorId: searchParams.get("visitorId") || "",
    };
  }, [searchParams]);

  const setInteractiveParams = useCallback(
    ({
      assetId,
      interactiveNonce,
      interactivePublicKey,
      profileId,
      sceneDropId,
      urlSlug,
      username,
      visitorId,
    }: InteractiveParams) => {
      const isInteractiveIframe =
        visitorId && interactiveNonce && interactivePublicKey && assetId;
      dispatch!({
        type: SET_INTERACTIVE_PARAMS,
        payload: {
          assetId,
          interactiveNonce,
          interactivePublicKey,
          isInteractiveIframe,
          profileId,
          sceneDropId,
          urlSlug,
          username,
          visitorId,
        },
      });
    },
    [dispatch]
  );

  const setHasSetupBackend = useCallback(
    (success: boolean) => {
      dispatch!({
        type: SET_HAS_SETUP_BACKEND,
        payload: { hasSetupBackend: success },
      });
    },
    [dispatch]
  );

  const setupBackend = async () => {
    const setupResult = await setupBackendAPI(interactiveParams);
    setHasSetupBackend(setupResult.success);
    if (!setupResult.success) navigate("*");
    else setHasInitBackendAPI(true);
  };

  useEffect(() => {
    if (interactiveParams.assetId) {
      setInteractiveParams({
        ...interactiveParams,
      });
    }
  }, [interactiveParams, setInteractiveParams]);

  useEffect(() => {
    if (!hasInitBackendAPI) setupBackend();
  }, [hasInitBackendAPI, interactiveParams]);

  return (
    <Routes>
      <Route path="clue" element={<Clue />} />
      <Route path="challenge" element={<Challenge />} />
      <Route path="admin" element={<Admin />} />
      <Route path="*" element={<Error />} />
    </Routes>
  );
};

export default App;
