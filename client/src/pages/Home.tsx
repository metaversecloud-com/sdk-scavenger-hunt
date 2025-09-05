import { useEffect, useState, useContext } from "react";

// components
import { PageContainer } from "@/components";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_IS_ADMIN, SET_THEME } from "@/context/types";
import { themeData } from "@/context/themeData";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { theme } = useContext(GlobalStateContext);

  const [imgUrl, setImgUrl] = useState();
  const [lastUpdated, setLastUpdated] = useState<Date>();
  const [question, setQuestion] = useState("");
  const [cluesFound, setCluesFound] = useState<string>("");
  const [totalClues, setTotalClues] = useState<string>("");
  const [hasCompletedClues, setHasCompletedClues] = useState(true);
  const [answer, setAnswer] = useState("");
  const [hasAnsweredChallenge, setHasAnsweredChallenge] = useState(false);
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
      .then((response) => {
        const { success, cluesFound, challenge, hasCompletedClues, hasCompletedChallenge, isAdmin, theme, totalClues } =
          response.data;

        if (success) {
          setImgUrl(challenge?.imgUrl || `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}IMG_Start.png`);
          setLastUpdated(challenge?.lastUpdated);
          setQuestion(challenge?.text || "Please, go to the admin section to edit the Challenge message.");
          setCluesFound(cluesFound);
          setTotalClues(totalClues);
          setHasCompletedClues(hasCompletedClues);
          setHasAnsweredChallenge(hasCompletedChallenge);
          setTheme(theme);
          setIsLoading(false);
          dispatch!({
            type: SET_THEME,
            payload: { theme },
          });
          dispatch!({
            type: SET_IS_ADMIN,
            payload: { isAdmin },
          });
        }
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
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
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setAnswering(false));
  };

  const handleRestart = async () => {
    await backendAPI
      .post(`/restart-challenge`)
      .then((response) => {
        const { cluesFound, hasCompletedClues, hasCompletedChallenge, totalClues } = response.data;
        setCluesFound(cluesFound);
        setTotalClues(totalClues);
        setHasCompletedClues(hasCompletedClues);
        setHasAnsweredChallenge(hasCompletedChallenge);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  };

  return (
    <PageContainer isLoading={isLoading || !imgUrl} headerText="Challenge">
      <>
        <div className="container px-6 justify-start">
          <div className="mt-6" style={{ textAlign: "center", margin: "0 auto" }}>
            <img
              style={{ width: "130px", borderRadius: "10%", textAlign: "center", margin: "0 auto" }}
              src={themeData?.[currentTheme]?.challengeTitleImgUrl || imgUrl}
            />
          </div>
          <div className="pl-4" style={{ textAlign: "center", margin: "0 auto" }}>
            <h3 style={{ marginBottom: "0px" }}>{themeData?.[currentTheme]?.title}</h3>
            <div>
              <p>Scavenger Hunt</p>
            </div>
          </div>
        </div>
        {hasAnsweredChallenge ? (
          <div className="container py-6 flex text-center">
            <h5>Nice one! You completed the challenge!</h5>
          </div>
        ) : (
          <div className="container py-6 items-center justify-start">
            {hasCompletedClues ? (
              <div className="flex flex-col">
                <h3>Nice Job! </h3>
                <p>
                  {theme === "robot"
                    ? "Answer the final question and unlock a new emote!"
                    : "Answer the final question and see what happens!"}
                </p>
                <div className="mt-8">
                  <p>{question}</p>
                </div>
                <div className="mt-2">
                  <label>Answer</label>
                  <input
                    className="input"
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setAnswer(event.target.value);
                    }}
                    value={answer}
                  />
                  <div className="mt-2">
                    <button className="btn" onClick={completeChallenge} disabled={answering}>
                      Submit
                    </button>
                  </div>
                  {incorrectAnswer >= 0 && (
                    <p className="pt-4 text-error">{incorrectAnswerRotation[incorrectAnswer]}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <p>
                  Explore the world to find all of the clues! Once you've found all of the clues, come back here to
                  answer the question and unlock a new emote!
                </p>
                <br />
                <h4 className="text-center">
                  Completed {cluesFound} of {totalClues}
                </h4>
              </div>
            )}
          </div>
        )}
        {parseInt(cluesFound) > 0 && (
          <>
            {lastUpdated && (
              <div className="container py-6">
                <h5>This Scavenger Hunt was last updated on {new Date(lastUpdated).toLocaleString()}</h5>
              </div>
            )}
            <button className="btn" onClick={handleRestart}>
              Restart Scavenger Hunt
            </button>
          </>
        )}
      </>
    </PageContainer>
  );
};

export default Home;
