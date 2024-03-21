import { useState } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { backendAPI } from "@/utils/backendAPI";

const fixedClueImages = [
  {
    id: 0,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_1.png",
    text: "Clue image one",
  },
  {
    id: 1,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_2.png",
    text: "Clue image two",
  },
  {
    id: 2,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_3.png",
    text: "Clue image three",
  },
  {
    id: 3,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_4.png",
    text: "Clue image four",
  },
  {
    id: 4,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_5.png",
    text: "Clue image five",
  },
  {
    id: 5,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_6.png",
    text: "Clue image six",
  },
  {
    id: 6,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_7.png",
    text: "Clue image seven",
  },
  {
    id: 7,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_8.png",
    text: "Clue image eight",
  },
  {
    id: 8,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_9.png",
    text: "Clue image nine",
  },
  {
    id: 9,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_10.png",
    text: "Clue image ten",
  },
  {
    id: 10,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_11.png",
    text: "Clue image eleven",
  },
  {
    id: 11,
    image: "https://sdk-scavenger-hunt.s3.amazonaws.com/IMG_12.png",
    text: "Clue image twelve",
  },
];

export const EditClue = ({
  clue,
  onCloseModal,
}: {
  clue: any;
  onCloseModal: any;
}) => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(clue.image);
  const [text, setText] = useState(clue.text);
  const [isSaving, setIsSaving] = useState(false);

  async function onSave() {
    try {
      setIsSaving(true);
      await backendAPI.post(`/admin/updateClue`, {
        assetId: clue.assetId,
        text,
        imageUrl: selectedImage,
      })
      setIsSaving(false);
      onCloseModal();
    } catch (error) {
      console.log(error);
      navigate("*");
      setIsSaving(false);
    }
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
            setSelectedImage(event.target.value);
          }}
          value={selectedImage}
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
