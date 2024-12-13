import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context
import { GlobalStateContext } from "@/context/GlobalContext";
import { getFixedClueImages, NATIONAL_PARK } from "@/context/constants";
import { themeData } from "@/context/themeData";
import { ClueType } from "@/context/types";

export const EditClue = ({
  clue,
  onCloseModal,
  onCluesUpdated,
}: {
  clue: ClueType;
  onCloseModal: () => void;
  onCluesUpdated: () => void;
}) => {
  const { theme } = useContext(GlobalStateContext);
  const fixedClueImages = getFixedClueImages(theme || NATIONAL_PARK);

  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(clue?.imgUrl || fixedClueImages[0].image);
  const [contentImgUrl, setContentImgUrl] = useState(clue?.contentImgUrl);
  const [text, setText] = useState(clue?.text);
  const [isSaving, setIsSaving] = useState(false);

  async function onSave() {
    try {
      await backendAPI.post(`/update-clue`, {
        assetId: clue?.id,
        text,
        imgUrl: selectedImage,
        contentImgUrl,
      });
      if (onCluesUpdated) onCluesUpdated();
    } catch (error) {
      navigate("*");
    } finally {
      setIsSaving(false);
      onCloseModal();
    }
    setIsSaving(true);
  }

  const ClueImages = ({ clue }: { clue: { id: number; image: string; text: string } }) => {
    const { id, image, text } = clue;
    return (
      <div
        key={id}
        onClick={() => setSelectedImage(image)}
        className={`clue-image ${selectedImage === image ? "selected" : ""}`}
      >
        <img src={image} alt={text} />
      </div>
    );
  };

  return (
    <div style={{ overflow: "auto" }}>
      <div style={{ textAlign: "left", top: "100%" }}>
        <h4>Clue Configuration</h4>
        <p className="pb-3">
          You can change the clue text and image it shows in the drawer. Click on the Save button at the bottom of the
          screen to save the configuration.
        </p>

        <label>Clue Text</label>
        <textarea
          className="input mb-4"
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setText(event.target.value);
          }}
          value={text}
        />

        <label>Clue Image URL</label>
        <input
          className="input"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setContentImgUrl(event.target.value);
          }}
          value={contentImgUrl}
        />

        <div style={{ marginTop: "24px" }}>
          <h4>Asset Image</h4>
          <p className="pb-3">Pick an image for this clue.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {fixedClueImages
              ?.slice(0, themeData[theme!].numberOfAssetsAvailableInAdminSection)
              .map((item, index) => <ClueImages key={index} clue={item} />)}
          </div>

          <div style={{ display: "flex", columnGap: "7px", marginTop: "16px" }}>
            <button className="btn btn-outline" onClick={onCloseModal}>
              Close
            </button>
            <button className="btn" onClick={onSave} disabled={isSaving}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditClue;
