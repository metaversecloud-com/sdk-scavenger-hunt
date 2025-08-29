import { useEffect, useState, useContext } from "react";

// components
import { Loading } from "@/components";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { SET_THEME } from "@/context/types";
import { TOPIA_WORKERS_URL } from "@/context/constants";
import { setErrorMessage } from "@/utils/setErrorMessage";

export const Clue = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const [cluesFound, setCluesFound] = useState<string>("");
  const [totalClues, setTotalClues] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [contentImgUrl, setContentImgUrl] = useState<string>("");
  const [isVideo, setIsVideo] = useState(false);
  const [text, setText] = useState<string>("");
  const [isModal, setIsModal] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getClue();
  }, [backendAPI]);

  const getClue = async () => {
    setIsLoading(true);
    backendAPI
      .get(`/clue`)
      .then((result) => {
        const { cluesFound, totalClues, imgUrl, contentImgUrl, isVideo, text, theme, linkBehavior } = result.data;
        setCluesFound(cluesFound);
        setTotalClues(totalClues);
        setImgUrl(imgUrl);
        setContentImgUrl(contentImgUrl);
        setIsVideo(isVideo);
        setText(text);
        setIsModal(linkBehavior === "modal");
        setIsLoading(false);
        dispatch!({
          type: SET_THEME,
          payload: theme,
        });
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  };

  if (isLoading || !cluesFound) return <Loading />;

  return (
    <div className="container p-6">
      <div className="text-center mb-6">
        <img
          className="mx-auto rounded-xl mb-4"
          style={{ maxWidth: "100%", maxHeight: "150px" }}
          src={imgUrl}
          alt="Clue"
        />
        {isModal ? (
          <>
            <h4>
              Congratulations! You have found a clue! Completed {cluesFound} of {totalClues}.
            </h4>
          </>
        ) : (
          <>
            <h2 className="pb-2">Congratulations!</h2>
            <h4>
              You have found a clue!
              <br />
              Completed {cluesFound} of {totalClues}
            </h4>
          </>
        )}
      </div>
      <div>
        {(contentImgUrl || TOPIA_WORKERS_URL) &&
          (isVideo ? (
            <iframe
              src={contentImgUrl}
              style={{
                margin: "auto",
                height: "240px",
              }}
              allowFullScreen
              title="Clue Video"
            ></iframe>
          ) : (
            <img
              className="mx-auto rounded-xl"
              style={{ maxWidth: "100%", maxHeight: "200px" }}
              src={contentImgUrl || TOPIA_WORKERS_URL}
              alt="Content Image"
            />
          ))}
        <p className="pt-2" style={{ whiteSpace: "pre-line" }}>
          {text}
        </p>
      </div>
      {cluesFound === totalClues ? (
        <div className="mb-8 mt-10">
          <hr />
          <p className="text-success pb-4 pt-4">
            You have unlocked the final challenge question! Please return to the first sign to continue.
          </p>
          <hr />
        </div>
      ) : null}
    </div>
  );
};

export default Clue;
