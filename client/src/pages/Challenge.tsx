import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";

// context 
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_THEME } from "@/context/types";
import { themeData } from "@/context/themeData";

export const Challenge = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();
  const { theme } = useContext(GlobalStateContext);
  const [imageUrl, setImageUrl] = useState();
  const [question, setQuestion] = useState("");
  const [hasCompletedClues, setHasCompletedClues] = useState(true);
  const [answer, setAnswer] = useState("");
  const [hasAnsweredChallenge, setHasAnsweredChallenge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [incorrectAnswer, setIncorrectAnswer] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [answering, setAnswering] = useState(false);
  const [currentTheme, setTheme] = useState("");

  const incorrectAnswerRotation = [
    "Try one more time!",
    "Not correct but keep going!",
    "Close! Try again!",
    "Not quite right, double check and come back!",
    "Check the clues again for help with the answer!",
  ];

  useEffect(() => {
    backendAPI
      .get(`/challenge`)
      .then((result) => {
        const {
          success,
          challenge,
          hasCompletedClues,
          hasCompletedChallenge,
          isAdmin,
          theme
        } = result.data;
        
        if (success) {
          setImageUrl(challenge?.imageUrl || `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}IMG_Start.png`);
          setQuestion(challenge?.text || "Please, go to the admin section to edit the Challenge message.");
          setHasCompletedClues(hasCompletedClues);
          setHasAnsweredChallenge(hasCompletedChallenge);
          setIsAdmin(isAdmin);
          setTheme(theme);
          setIsLoading(false);
          dispatch!({
            type: SET_THEME,
            payload: theme,
          });
          // console.log("theme", theme);
        }
      })
      .catch(() => {
        setIsLoading(false);
        navigate("*");
      });
  }, [backendAPI]);

  const completeChallenge = async () => {
    setIncorrectAnswer(-1);
    setAnswering(true);
    await backendAPI
      .post(`/answer-challenge`, { answer })
      .then((result) => {
        const { isCorrect } = result.data;
        if (!isCorrect) setIncorrectAnswer(Math.floor(Math.random() * 5));
        setHasAnsweredChallenge(isCorrect);
      })
      .catch(() => navigate("*"))
      .finally(() => setAnswering(false));
  };

  const getHeader = () => (
    <>
      {isAdmin && <Header activeTab="challenge" />}
      <div className="container px-6 flex items-center justify-start">
        <div className="flex flex-col mt-6">
          <img
            style={{ height: "100px", width: "70px", borderRadius: "10%" }}
            src={themeData?.[currentTheme]?.challengeTitleImgUrl || imageUrl}
          />
        </div>
        <div className="flex flex-col pl-4">
          <h3 style={{ marginBottom: "0px" }}>{themeData?.[currentTheme]?.title}</h3>
          <div>Scavenger Hunt</div>
        </div>
      </div>
    </>
  );

  if (isLoading || !imageUrl) return <Loading />;

  if (hasAnsweredChallenge) {
    return (
      <>
        {getHeader()}
        <div className="container p-6 flex items-center justify-start">
          <div className="flex flex-col">
            <h5>{themeData?.[theme]?.correctAnswerCongratulations}</h5>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {getHeader()}
      <div className="container p-6 items-center justify-start">
        {hasCompletedClues ? (
          <div className="flex flex-col">
            <h3>Nice Job! </h3>
            <p>Answer the final question and see what happens!!</p>
            <div className="mt-6">{question}</div>
            <div className="mt-2">
              <label>Answer</label>
              <input
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setAnswer(event.target.value);
                }}
                style={{ width: "100%" }}
                value={answer}
              />
              <div className="mt-2">
                <button onClick={completeChallenge} disabled={answering}>
                  Submit
                </button>
              </div>
              {incorrectAnswer >= 0 && (
                <p className="pt-4 text-error">
                  {incorrectAnswerRotation[incorrectAnswer]}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="mt-6">
              <div>
                Find all the clues, and then come back to answer the final
                question!
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Challenge;
