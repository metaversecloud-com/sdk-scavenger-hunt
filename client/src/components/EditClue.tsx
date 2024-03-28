import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context 
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";

export const EditClue = ({
  clue,
  onCloseModal,
  onCluesUpdated
}: {
  clue: any;
  onCloseModal: any;
  onCluesUpdated: any;
}) => {
  const {theme} = useContext(GlobalStateContext) || "national-park";
  const fixedClueImages = [
    {
      id: 0,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_1.png`,
      text: "Clue image one",
    },
    {
      id: 1,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_2.png`,
      text: "Clue image two",
    },
    {
      id: 2,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_3.png`,
      text: "Clue image three",
    },
    {
      id: 3,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_4.png`,
      text: "Clue image four",
    },
    {
      id: 4,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_5.png`,
      text: "Clue image five",
    },
    {
      id: 5,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_6.png`,
      text: "Clue image six",
    },
    {
      id: 6,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_7.png`,
      text: "Clue image seven",
    },
    {
      id: 7,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_8.png`,
      text: "Clue image eight",
    },
    {
      id: 8,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_9.png`,
      text: "Clue image nine",
    },
    {
      id: 9,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_10.png`,
      text: "Clue image ten",
    },
    {
      id: 10,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_11.png`,
      text: "Clue image eleven",
    },
    {
      id: 11,
      image: `https://sdk-scavenger-hunt.s3.amazonaws.com/${theme}/IMG_12.png`,
      text: "Clue image twelve",
    },
  ];
  
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(clue?.imageUrl || fixedClueImages[0].image);
  const [contentImgUrl, setContentImgUrl] = useState(clue?.contentImgUrl);
  const [text, setText] = useState(clue?.text);
  const [isSaving, setIsSaving] = useState(false);

  async function onSave() {
    try {
      const result = await backendAPI.post(`/update-clue`, {
        assetId: clue?.id,
        text,
        imageUrl: selectedImage,
        contentImgUrl
      });
      if (onCluesUpdated) {
        onCluesUpdated();
      }
    } catch (error) {
      navigate("*")
    } finally {
      setIsSaving(false);
      onCloseModal();
    }
    setIsSaving(true);
  }

  const ClueImages = ({ item }: { item: any }) => {
    const { id, image, text } = item;
    return (
      <div
        className="card small mt-4 cursor-pointer"
        key={id}
        onClick={() => setSelectedImage(image)}
        style={{
          border: selectedImage === image ? "2px solid #555" : "inherit",
        }}
      >
        <div
          className="card-image"
          style={{
            height: "70px",
            width: "70px",
            minWidth: "70px",
            overflow: "hidden",
          }}
        >
          <img src={image} />
        </div>
        <div className="card-title">{text}</div>
      </div>
    );
  };

  return (
    <div className="modal-container visible" style={{ overflow: "auto" }}>
      <div className="modal" style={{ textAlign: "left", top: "100%" }}>
        <h3>Clue Configuration</h3>
        <p>
          You can change the clue text and image it shows in the drawer. Click
          on the Save button at the bottom of the screen to save the
          configuration.
        </p>

        <label>Clue</label>
        <input
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setText(event.target.value);
          }}
          type="textarea"
          value={text}
        />

        <label>Clue Image URL</label>
        <input
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setContentImgUrl(event.target.value);
          }}
          value={contentImgUrl}
        />

        <div className="mt-6">
          <h4>Asset Image</h4>
          <p>Pick an image for this clue.</p>
          {fixedClueImages.map((item) => (
            <ClueImages item={item} />
          ))}

          <div className="actions">
            <button className="btn-outline" onClick={onCloseModal}>
              Close
            </button>
            <button onClick={onSave} disabled={isSaving}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClue;
