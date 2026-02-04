import { useEffect, useState, useContext } from "react";

// components
import { PageContainer } from "@/components";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_CONFIG, SET_PROGRESS } from "@/context/types";
import { themeData } from "@/context/themeData";

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend, theme, challenge, cluesFound, totalClues, hasCompletedClues, hasCompletedChallenge } =
    useContext(GlobalStateContext);

  const [answer, setAnswer] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [incorrectAnswer, setIncorrectAnswer] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  const incorrectAnswerRotation = [
    "Try one more time!",
    "Not correct but keep going!",
    "Close! Try again!",
    "Not quite right, double check and come back!",
    "Check the items again for help with the answer!",
  ];

  useEffect(() => {
    if (hasSetupBackend) getChallenge();
  }, [hasSetupBackend]);

  const getChallenge = async () => {
    await backendAPI
      .get(`/challenge`)
      .then((response) => {
        const { cluesFound, challenge, hasCompletedClues, hasCompletedChallenge, isAdmin, theme, totalClues } =
          response.data;
        dispatch!({
          type: SET_CONFIG,
          payload: {
            challenge: {
              imgUrl: challenge?.imgUrl || `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_Start.png`,
              title: challenge?.title || "",
              text: challenge?.text || "Please, go to the admin section to edit the Challenge message.",
              lastUpdated: challenge?.lastUpdated,
              questionType: challenge?.questionType || "text",
              options: challenge?.options,
              correctAnswers: challenge?.correctAnswers,
            },
            theme,
            isAdmin,
          },
        });
        dispatch!({
          type: SET_PROGRESS,
          payload: {
            cluesFound,
            totalClues,
            hasCompletedClues,
            hasCompletedChallenge,
          },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  };

  const completeChallenge = async () => {
    setIncorrectAnswer(-1);
    setAnswering(true);
    const questionType = challenge?.questionType || "text";
    const payload =
      questionType === "text" ? { answer } : { selectedAnswers, questionType };

    await backendAPI
      .post(`/answer-challenge`, payload)
      .then((result) => {
        const { isCorrect } = result.data;
        if (!isCorrect) setIncorrectAnswer(Math.floor(Math.random() * 5));
        if (isCorrect) {
          dispatch!({
            type: SET_PROGRESS,
            payload: { hasCompletedChallenge: true },
          });
        }
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setAnswering(false));
  };

  const handleRestart = async () => {
    await backendAPI
      .post(`/restart-challenge`)
      .then((response) => {
        const { cluesFound, hasCompletedClues, hasCompletedChallenge, totalClues } = response.data;
        dispatch!({
          type: SET_PROGRESS,
          payload: {
            cluesFound,
            totalClues,
            hasCompletedClues,
            hasCompletedChallenge,
          },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error));
  };

  const imgUrl = challenge?.imgUrl || `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_Start.png`;

  return (
    <PageContainer isLoading={isLoading} headerText="Challenge">
      <>
        <div className="container px-6 justify-start">
          <div className="mt-6" style={{ textAlign: "center", margin: "0 auto" }}>
            <img
              style={{ width: "130px", borderRadius: "10%", textAlign: "center", margin: "0 auto" }}
              src={themeData?.[theme || ""]?.challengeTitleImgUrl || imgUrl}
            />
          </div>
          <div className="pl-4" style={{ textAlign: "center", margin: "0 auto" }}>
            <h3 style={{ marginBottom: "0px" }}>{challenge?.title || themeData?.[theme || ""]?.title}</h3>
            <div>
              <p>Scavenger Hunt</p>
            </div>
          </div>
        </div>
        {hasCompletedChallenge ? (
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
                  <p>{challenge?.text}</p>
                </div>
                <div className="mt-2">
                  {(!challenge?.questionType || challenge.questionType === "text") ? (
                    <>
                      <label>Answer</label>
                      <input
                        className="input"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          setAnswer(event.target.value);
                        }}
                        value={answer}
                      />
                    </>
                  ) : (
                    <>
                      <label>
                        {challenge.questionType === "multiple_choice"
                          ? "Select the correct answer:"
                          : "Select all that apply:"}
                      </label>
                      <div className="mt-2">
                        {challenge.options &&
                          Object.keys(challenge.options).map((key) => (
                            <div key={key} className="flex items-center mb-2">
                              {challenge.questionType === "multiple_choice" ? (
                                <input
                                  type="radio"
                                  name="challengeAnswer"
                                  checked={selectedAnswers.includes(key)}
                                  onChange={() => setSelectedAnswers([key])}
                                  className="mr-2"
                                  style={{ width: "20px", height: "20px" }}
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedAnswers.includes(key)}
                                  onChange={() =>
                                    setSelectedAnswers((prev) =>
                                      prev.includes(key)
                                        ? prev.filter((k) => k !== key)
                                        : [...prev, key]
                                    )
                                  }
                                  className="mr-2"
                                  style={{ width: "20px", height: "20px" }}
                                />
                              )}
                              <span>{challenge.options![key]}</span>
                            </div>
                          ))}
                      </div>
                    </>
                  )}
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
                  Explore the world to find all of the items! Once you've found all of the items, come back here to
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
        {(cluesFound || 0) > 0 && (
          <>
            {challenge?.lastUpdated && (
              <div className="container py-6">
                <h5>This Scavenger Hunt was last updated on {new Date(challenge.lastUpdated).toLocaleString()}</h5>
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
