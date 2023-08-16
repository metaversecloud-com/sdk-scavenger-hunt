import { Button, CircularProgress, LinearProgress, TextField } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function Challenge() {
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
    "Nice one! The tree got another leaf!"
  ]

  useEffect(() => {
    async function getChallenge() {
      const res = await axios.get(`/backend/challenge${document.location.search}`);
      setQuestion(res.data.challenge.text);
      setHasCompleted(res.data.hasCompletedClues);
      setAnsweredChallenge(res.data.hasCompletedChallenge);
      setIsAdmin(res.data.isAdmin);
      setLoading(false)
    }

    getChallenge();
  }, []);

  const completeChallenge = async () => {
    setIncorrectAnswer(-1);
    setAnswering(true);
    const res = await axios.post(`/backend/answerChallenge${document.location.search}`, { answer });
    if(!res.data.isCorrect) setIncorrectAnswer(Math.floor(Math.random() * 5));
    setAnsweredChallenge(res.data.isCorrect);
    setAnswering(false);
  };

  const rHeader = () => (
    <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: "40px" }}>
      <img
        style={{ height: "100px", width: "70px", borderRadius: "10%" }}
        src={"https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_Start.png"}
      />
      <div style={{ padding: "10px" }}>
        <h3 style={{ marginBottom: "0px" }}>National Parks</h3>
        <div> Scavenger Hunt</div>
      </div>
    </div>
  );

  if (loading)
  return (
    <div style={{ padding: "20px" }}>
      Loading...
      <LinearProgress />
    </div>
  );

  if (answeredChallenge) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "white",
          height: "95vh",
        }}
      >
        {rHeader()}
        <h2 style={{textAlign: "center", padding:"5px"}}> {correctAnswerRotation[(Math.floor(Math.random() * 3))]}</h2>
        {isAdmin && (
        <div>
          <Link to={`/admin${document.location.search}`}>Administrator Section</Link>
        </div>
      )}
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        flexDirection: "column",
        alignItems: "center",
        height: "95vh",
      }}
    >
      {rHeader()}
      {hasCompleted ? (
        <div
          style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: "40px", textAlign: "center" }}
        >
          <div style={{ marginBottom: "100px" }}>
            <h3>Nice Job! </h3>
            <div>Answer the final question and see what happens!!</div>
          </div>
          <div style={{ padding: "10px" }}>
            <div style={{ padding: "10px" }}>{question}</div>
            <TextField
              id="outlined-basic"
              label="Answer"
              variant="outlined"
              fullWidth
              value={answer}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setAnswer(event.target.value);
              }}
            />
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Button
                style={{ marginTop: "10px", alignSelf: "center", justifySelf: "center" }}
                variant="outlined"
                onClick={completeChallenge}
                disabled={answering}
              >
                Submit { answering && <CircularProgress /> }
              </Button>
              
            </div>
            {incorrectAnswer >= 0 && (
              <div style={{ marginTop: "100px", color: "red" }}>{incorrectAnswerRotation[incorrectAnswer]}</div>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", padding: "40px", textAlign: "center" }}
        >
          <div style={{ padding: "10px" }}>
            <div>Find all the clues, and then come back to answer the final question!</div>
          </div>
        </div>
      )}

      {isAdmin && (
        <div>
          <Link to={`/admin${document.location.search}`}>Administrator Section</Link>
        </div>
      )}
    </div>
  );
}

export default Challenge;
