import { useState, useContext } from "react";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { getFixedClueImages, NATIONAL_PARK } from "@/context/constants";
import { themeData } from "@/context/themeData";
import { ClueType } from "@/context/types";

const CUSTOM_THEME = "custom";

export const EditClueModal = ({
  clue,
  onCloseModal,
  onCluesUpdated,
}: {
  clue: ClueType;
  onCloseModal: () => void;
  onCluesUpdated: () => void;
}) => {
  const { theme } = useContext(GlobalStateContext);
  const dispatch = useContext(GlobalDispatchContext);

  const isCustomTheme = theme === CUSTOM_THEME;
  const fixedClueImages = getFixedClueImages(theme || NATIONAL_PARK);

  const [selectedImage, setSelectedImage] = useState(
    clue?.imgUrl || (isCustomTheme ? "" : fixedClueImages[0].image),
  );
  const [contentUrl, setContentUrl] = useState(clue?.contentUrl);
  const [mediaType, setMediaType] = useState(clue?.mediaType || "image");
  const [linkBehavior, setLinkBehavior] = useState(clue?.linkBehavior || "drawer");
  const [text, setText] = useState(clue?.text);
  const [isSaving, setIsSaving] = useState(false);

  async function onSave() {
    backendAPI
      .post(`/update-clue`, {
        assetId: clue?.id,
        text,
        imgUrl: selectedImage,
        contentUrl,
        mediaType,
        linkBehavior,
      })
      .then(() => {
        if (onCluesUpdated) onCluesUpdated();
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setIsSaving(false);
        onCloseModal();
      });

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
    <div className="modal-container">
      <div className="modal" style={{ maxHeight: "90vh" }}>
        <h4>Clue Configuration</h4>
        <p className="pb-3">
          You can change the clue text and image it shows in the drawer. Click on the Save button at the bottom of the
          screen to save the configuration.
        </p>

        <label className="text-left">Clue Text</label>
        <textarea
          className="input mb-4"
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setText(event.target.value);
          }}
          value={text}
          style={{ minHeight: "100px" }}
        />

        <label className="text-left">Clue Media URL</label>
        <input
          className="input mb-4"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setContentUrl(event.target.value);
          }}
          value={contentUrl}
        />

        <label className="text-left mb-2">
          Media Type
          <select
            className="input"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setMediaType(event.target.value as "image" | "video" | "website");
            }}
            value={mediaType}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="website">Website Embed</option>
          </select>
        </label>

        <p className=" text-left">📹 Heads up!</p>
        <p className="p2 pb-4 text-left">
          To make your video play inside the app, be sure to use an embed link, not the regular share link.
        </p>

        <label className="text-left">
          Link Behavior
          <select
            className="input"
            onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
              setLinkBehavior(event.target.value as "modal" | "drawer" | "tab");
            }}
            value={linkBehavior}
          >
            <option value="modal">Open in modal iframe</option>
            <option value="drawer">Open in drawer iframe</option>
            {/* <option value="tab">Open in a new tab</option> unable to track open */}
          </select>
        </label>

        <div style={{ marginTop: "24px" }}>
          <h4>Asset Image</h4>
          {isCustomTheme ? (
            <>
              <p className="pb-3">Enter a URL for the clue image.</p>
              <input
                className="input mb-4"
                placeholder="https://example.com/image.png"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setSelectedImage(event.target.value);
                }}
                value={selectedImage}
              />
              {selectedImage && (
                <div className="mb-4">
                  <p className="p2 pb-2 text-left">Preview:</p>
                  <img
                    src={selectedImage}
                    alt="Preview"
                    style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain" }}
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <p className="pb-3">Pick an image for this clue.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                {fixedClueImages
                  ?.slice(0, themeData[theme!].numberOfAssetsAvailableInAdminSection)
                  .map((item, index) => <ClueImages key={index} clue={item} />)}
              </div>
            </>
          )}

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

export default EditClueModal;
