import { Box, Button, CircularProgress, LinearProgress, TextField } from "@mui/material";
import { useParams } from "react-router-dom";
import ListComponent from "../../../components/ListComponent";
import { useEffect, useState } from "react";
import axios from "axios";

const fixedClueImages = [
  {
    id: 0,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_1.png",
    text: "Clue image one",
  },
  {
    id: 1,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_2.png",
    text: "Clue image two",
  },
  {
    id: 2,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_3.png",
    text: "Clue image three",
  },
  {
    id: 3,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_4.png",
    text: "Clue image four",
  },
  {
    id: 4,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_5.png",
    text: "Clue image five",
  },
  {
    id: 5,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_6.png",
    text: "Clue image six",
  },
  {
    id: 6,
    image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_7.png",
    text: "Clue image seven",
  },
];

function ClueConfiguration() {
  const { id } = useParams();
  const [selected, setSelected] = useState(-1);
  const [text, setText] = useState("");
  const [imageURL, setImageURL] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleClick(item) {
    setSelected(item.id);
  }

  useEffect(() => {
    async function getClue() {
      const res = await axios.get(`/backend/admin/clue/${id}${document.location.search}`);
      console.log(res.data);

      setText(res.data.text);
      setImageURL(res.data.image);

      const imageURL = `https://${res.data.assetImage}`;
      const asset = fixedClueImages.find((asset) => asset.image === imageURL);

      if (asset) {
        setSelected(asset.id);
      }

      setLoading(false);
    }
    getClue();
  }, []);

  async function onSave() {
    console.log("save");
    setSaving(true)
    const res = await axios.post(`/backend/admin/updateClue${document.location.search}`, {
      assetId: id,
      text,
      image: fixedClueImages[selected].image,
      imageURL,
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
    <Box sx={{ flexDirection: "column", display: "flex", gap: 1, border: "1px solid grey", p: 2, mt: 3 }}>
      <h4>Clue Configuration</h4>
      <div>
        You can change the clue text, image it shows in the window. After you have configured everything, click on the
        Save button to save the configuration.
      </div>
      <Box sx={{ m: 1, position: "relative" }}>
        <Button variant="contained" style={{ alignSelf: "center" }} sx={{ my: 2 }} onClick={onSave} disabled={saving}>
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
      <TextField
        label="Clue"
        multiline
        rows={4}
        fullWidth
        margin="normal"
        value={text}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setText(event.target.value);
        }}
      />

      <TextField
        label="Clue Image URL"
        fullWidth
        margin="normal"
        value={imageURL}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setImageURL(event.target.value);
        }}
      />
      <ListComponent
        title="Asset Image"
        subTitle="Pick an image for this clue"
        items={fixedClueImages}
        currentSelection={selected}
        onClick={handleClick}
      />
    </Box>
  );
}

export default ClueConfiguration;
