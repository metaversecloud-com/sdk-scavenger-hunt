import { Outlet, useOutletContext } from "react-router-dom";
import { Box, Button, CircularProgress, LinearProgress, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";

type assets = any[];
type ContextType = { assets: assets };

function Clue() {
  // const { id } = useParams();
  const [assets, setAssets] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function getConfigList() {
      const res = await axios.get(`/backend/admin/config${document.location.search}`);

      const newAssets = res.data.clues.map((asset, i) => {
        return {
          image: asset.assetImage,
          text: asset.clueText || `Clue ${i + 1}`,
          assetId: asset.id,
        };
      });

      setQuestion(res.data.challenge.text);
      setAnswer(res.data.challenge.answer);

      setAssets(newAssets);
      setLoading(false);
    }

    getConfigList();
  }, []);

  async function onSave() {
    setSaving(true)
  
    const res = await axios.post(`/backend/admin/updateChallenge${document.location.search}`, {
      text: question,
      answer,
    });

    console.log(res.data);
    setSaving(false)
  }

  if (loading)
    return (
      <div style={{ padding: "20px" }}>
        <LinearProgress />
      </div>
    );

  return (
    <div>
      <h3 style={{textAlign: "center"}}>Configurations</h3>

      <Box sx={{ flexDirection: "column", display: "flex", gap: 2, border: "1px solid grey", p: 2, m:1 }}>
        <h4>Challenge Configuration</h4>
        <div style={{ paddingBottom: "20px" }}>
          This is the final challenge question that the participants need to solve. Enter a question, and answer (non
          case sensitive) and click the save button.
        </div>
        <TextField
          id="outlined-basic"
          label="Question"
          variant="outlined"
          multiline
          rows={4}
          fullWidth
          value={question}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setQuestion(event.target.value);
          }}
        />
        <TextField
          id="outlined-basic"
          label="Answer"
          variant="outlined"
          value={answer}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setAnswer(event.target.value);
          }}
        />
        <Box sx={{ m: 1, position: "relative" }}>
          <Button variant="contained" style={{ maxWidth: "50%", alignSelf: "center" }} sx={{ my: 4 }} onClick={onSave} disabled={saving}>
            Save
          </Button>
          {saving && (
            <CircularProgress
              size={24}
              sx={{
                position: "absolute",
                top: "50%",
                left: "30%",
                marginTop: "-12px",
                marginLeft: "-12px",
              }}
            />
          )}
        </Box>
      </Box>
      <Outlet context={{ assets }} />
    </div>
  );
}

export function useConfig() {
  return useOutletContext<ContextType>();
}

export default Clue;
