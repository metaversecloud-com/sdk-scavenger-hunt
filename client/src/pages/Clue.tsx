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
  const [contentUrl, setContentUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"image" | "video" | "website">("image");
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
      .then(async (result) => {
        const { cluesFound, totalClues, imgUrl, contentUrl, mediaType, text, theme, linkBehavior } = result.data;
        setCluesFound(cluesFound);
        setTotalClues(totalClues);
        setImgUrl(imgUrl);
        setContentUrl(contentUrl);
        setMediaType(mediaType);
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
    <div className="container p-6 m-auto">
      <div className="text-center mb-6">
        <img
          className="mx-auto rounded-xl mb-4"
          style={{ maxWidth: "100%", maxHeight: "150px" }}
          src={imgUrl}
          alt="Item"
        />
        {isModal ? (
          <>
            <h4>
              You discovered an item. Progress: {cluesFound} of {totalClues} completed.
            </h4>
          </>
        ) : (
          <>
            <h2 className="pb-2">Congratulations!</h2>
            <h4>
              You discovered an item.
              <br />
              Progress: {cluesFound} of {totalClues} completed.
            </h4>
          </>
        )}
      </div>
      <div>
        <p className="pb-2" style={{ whiteSpace: "pre-line" }}>
          {text}
        </p>
        {(contentUrl || TOPIA_WORKERS_URL) &&
          (mediaType === "video" ? (
            <iframe
              src={contentUrl}
              style={{
                margin: "auto",
                width: "100%",
                aspectRatio: "16/9",
              }}
              allowFullScreen
              title="Item Video"
            ></iframe>
          ) : mediaType === "website" ? (
            <iframe
              src={contentUrl}
              style={{
                margin: "auto",
                width: "100%",
                height: "440px",
                border: "none",
              }}
              title="Item Website"
            ></iframe>
          ) : (
            <img
              className="mx-auto rounded-xl"
              style={{ maxWidth: "100%", maxHeight: "200px" }}
              src={contentUrl || TOPIA_WORKERS_URL}
              alt="Content Image"
            />
          ))}
      </div>
      {cluesFound === totalClues ? (
        <div className="my-6">
          <hr />
          <p className="text-success pb-4 pt-4">Final challenge unlocked. Head back to the checkpoint to proceed.</p>
          <hr />
        </div>
      ) : null}
    </div>
  );
};

export default Clue;
