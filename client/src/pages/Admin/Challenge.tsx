import { useEffect, useState } from "react";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { Header } from "@/components/Header";
import { Loading } from "@/components/Loading";

export const Challenge = () => {
  const [question, setQuestion] = useState("");
  const [hasCompleted, setHasCompleted] = useState(true);
  const [answer, setAnswer] = useState("");
  const [answeredChallenge, setAnsweredChallenge] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [incorrectAnswer, setIncorrectAnswer] = useState(-1);
  const [loading, setLoading] = useState(true);
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
      const res = await backendAPI.get(`/challenge`);
      console.log("🚀 ~ file: Challenge.tsx:38 ~ res.data:", res.data);
      setQuestion(res.data.challenge.text);
      setHasCompleted(res.data.hasCompletedClues);
      setAnsweredChallenge(res.data.hasCompletedChallenge);
      setIsAdmin(res.data.isAdmin);
      setLoading(false);
    }

    getChallenge();
  }, []);

  const completeChallenge = async () => {
    setIncorrectAnswer(-1);
    setAnswering(true);
    const res = await backendAPI.post(`/answerChallenge`, { answer });
    if (!res.data.isCorrect) setIncorrectAnswer(Math.floor(Math.random() * 5));
    setAnsweredChallenge(res.data.isCorrect);
    setAnswering(false);
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

  if (loading) return <Loading />;

  if (answeredChallenge) {
    return (
      <div className="container p-6 flex items-center justify-start">
        {getHeader()}
        <h2 style={{ textAlign: "center", padding: "5px" }}>
          {" "}
          {correctAnswerRotation[Math.floor(Math.random() * 3)]}
        </h2>
      </div>
    );
  }

  return (
    <div className="container p-6 items-center justify-start">
      {getHeader()}
      {hasCompleted ? (
        <div className="flex flex-col">
          <div style={{ marginBottom: "100px" }}>
            <h3>Nice Job! </h3>
            <div>Answer the final question and see what happens!!</div>
          </div>
          <div style={{ padding: "10px" }}>
            <div style={{ padding: "10px" }}>{question}</div>

            <label>Answer</label>
            <input
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAnswer(event.target.value);
              }}
              value={answer}
            />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <button onClick={completeChallenge} disabled={answering}>
                Submit
              </button>
            </div>
            {incorrectAnswer >= 0 && (
              <div style={{ marginTop: "100px", color: "red" }}>
                {incorrectAnswerRotation[incorrectAnswer]}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          <div style={{ padding: "10px" }}>
            <div>
              Find all the clues, and then come back to answer the final
              question!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Challenge;
