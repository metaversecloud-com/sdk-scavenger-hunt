import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";

export const Challenge = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [hasCompletedClues, setHasCompletedClues] = useState(true);
  const [answer, setAnswer] = useState("");
  const [hasAnsweredChallenge, setHasAnsweredChallenge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [incorrectAnswer, setIncorrectAnswer] = useState(-1);
  const [isLoading, setIsLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  const incorrectAnswerRotation = [
    "Try one more time!",
    "Not correct but keep going!",
    "Close! Try again!",
    "Not quite right, double check and come back!",
    "Check the clues again for help with the answer!",
  ];

  const correctAnswerRotation = [
    "Good job, one more leaf!",
    "Great, you’ve added a leaf to the tree!",
    "Nice one! The tree got another leaf!",
  ];

  useEffect(() => {
    async function getChallenge() {
      try {
        await backendAPI
          .get(`/challenge`)
          .then((result) => {
            const {
              challenge,
              hasCompletedClues,
              hasCompletedChallenge,
              isAdmin,
            } = result.data;
            setQuestion(challenge?.text || "");
            setHasCompletedClues(hasCompletedClues);
            setHasAnsweredChallenge(hasCompletedChallenge);
            setIsAdmin(isAdmin);
          })
          .finally(() => setIsLoading(false));
      } catch (error) {
        console.log(error);
        navigate("*");
        setIsLoading(false);
      }
    }

    getChallenge();
  }, []);

  const completeChallenge = async () => {
    try {
      setIncorrectAnswer(-1);
      setAnswering(true);
      await backendAPI
        .post(`/answerChallenge`, { answer })
        .then((result) => {
          const { isCorrect } = result.data;
          if (!isCorrect) setIncorrectAnswer(Math.floor(Math.random() * 5));
          setHasAnsweredChallenge(isCorrect);
        })
        .finally(() => setAnswering(false));
    } catch (error) {
      console.log(error);
      navigate("*");
      setIsLoading(false);
    }
  };

  const getHeader = () => (
    <>
      {isAdmin && <Header activeTab="challenge" />}
      <div className="container p-6 flex items-center justify-start">
        <div className="flex flex-col mt-6">
          <img
            style={{ height: "100px", width: "70px", borderRadius: "10%" }}
            src={
              "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_Start.png"
            }
          />
        </div>
        <div className="flex flex-col pl-4">
          <h3 style={{ marginBottom: "0px" }}>National Parks</h3>
          <div> Scavenger Hunt</div>
        </div>
      </div>
    </>
  );

  if (isLoading) return <Loading />;

  if (hasAnsweredChallenge) {
    return (
      <>
        {getHeader()}
        <div className="container p-6 flex items-center justify-start">
          <div className="flex flex-col">
            <h5>{correctAnswerRotation[Math.floor(Math.random() * 3)]}</h5>
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
