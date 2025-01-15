import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { SET_THEME } from "@/context/types";
import { TOPIA_WORKERS_URL } from "@/context/constants";

export const Clue = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();
  const [cluesFound, setCluesFound] = useState<string>("");
  const [totalClues, setTotalClues] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [contentImgUrl, setContentImgUrl] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getClue();
  }, [backendAPI]);

  const getClue = async () => {
    setIsLoading(true);
    backendAPI
      .get(`/clue`)
      .then((result) => {
        const { success, cluesFound, totalClues, imgUrl, contentImgUrl, text, theme } = result.data;
        if (success) {
          setCluesFound(cluesFound);
          setTotalClues(totalClues);
          setImgUrl(imgUrl);
          setContentImgUrl(contentImgUrl);
          setText(text);
          setIsLoading(false);
          dispatch!({
            type: SET_THEME,
            payload: theme,
          });
        }
      })
      .catch((error) => {
        console.error("result error", error);
        navigate("*");
      })
      .finally(() => setIsLoading(false));
  };

  if (isLoading || !cluesFound) return <Loading />;

  return (
    <div className="container p-6">
      <div className="text-center mb-10">
        <img
          className="mx-auto rounded-xl mb-4"
          style={{ maxWidth: "100%", maxHeight: "400px" }}
          src={imgUrl}
          alt="Clue"
        />
        <h2 className="pb-2">Congratulations!</h2>
        <h4>
          You have found a clue!
          <br />
          Completed {cluesFound} of {totalClues}
        </h4>
      </div>
      <div>
        {(contentImgUrl || TOPIA_WORKERS_URL) && (
          <img
            className="mx-auto rounded-xl mb-2"
            style={{ maxWidth: "100%", maxHeight: "400px" }}
            src={contentImgUrl || TOPIA_WORKERS_URL}
            alt="Content Image"
          />
        )}
        <p style={{ whiteSpace: "pre-line" }}>{text}</p>
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
