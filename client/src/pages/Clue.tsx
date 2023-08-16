import { LinearProgress } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const Clue = () => {
  const { id } = useParams();
  const [clue, setClue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClue = async () => {
      const res = await axios.get(`/backend/clue/${id}${document.location.search}`);
      setClue(res.data);
      setLoading(false);
    };

    getClue();
  }, [id]);

  if (loading)
    return (
      <div style={{ padding: "20px" }}>
        Loading...
        <LinearProgress />
      </div>
    );
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          padding: "40px",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <img style={{ height: "120px", width: "70px", borderRadius: "10%" }} src={clue && clue.assetImage} />
        <div style={{ padding: "10px", textAlign: "center" }}>
          <h3 style={{ marginBottom: "5px" }}>Congratulations!</h3>
          <div> You have found a clue!</div>
          <div>
            Completed {clue && clue.cluesFound} of {clue && clue.totalClues}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px",
        }}
      >
        <img style={{ height: "300px", width: "300px", borderRadius: "10%" }} src={clue && clue.image} />
        <div style={{ maxWidth: "80%", paddingTop: "1rem", textAlign: "center" }}>{clue && clue.text}</div>
      </div>
      {clue.cluesFound === clue.totalClues && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            marginTop: "100px",
            marginLeft: "10px",
            marginRight: "10px",
            padding: "30px",
            textAlign: "center",
            border: "1px solid black",
            borderRadius: "10px",
          }}
        >
          <img
            style={{ height: "70px", width: "49px", borderRadius: "10%" }}
            src={"https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_Start.png"}
          />
          <div>Great Job! You have unlocked the final challenge question. Go back, to the first sign to continue.</div>
        </div>
      )}
    </div>
  );
};

export default Clue;
