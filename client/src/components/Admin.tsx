import { useEffect, useState, useContext } from "react";

// components
import { ConfirmationModal, EditClueModal, Loading } from "@/components";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ClueType, SET_THEME } from "@/context/types";

type EmoteType = {
  id: string;
  name: string;
  previewUrl: string;
};

export const Admin = () => {
  const dispatch = useContext(GlobalDispatchContext);

  const [clues, setClues] = useState<{ [id: string]: ClueType }>({});

  const [availableEmotes, setAvailableEmotes] = useState<EmoteType[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentTheme, setTheme] = useState("robot");
  const [buildableAssetUniqueName, setBuildableAssetUniqueName] = useState("");
  const [selectedEmote, setSelectedEmote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [showEditClueModal, setShowEditClueModal] = useState(false);
  const [selectedClue, setSelectedClue] = useState<ClueType | null>(null);
  const [areClueButtonsDisabled, setAreClueButtonsDisabled] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    backendAPI
      .get(`/config`)
      .then((result) => {
        const { clues, challenge, emotes, theme } = result.data;
        setQuestion(challenge.text);
        setAnswer(challenge.answer);
        setClues(clues);
        setAvailableEmotes(emotes);
        setTheme(theme);
        if (dispatch) {
          dispatch({
            type: SET_THEME,
            payload: { theme },
          });
        }
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  }, [backendAPI, dispatch]);

  const onSave = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/update-challenge`, {
        answer,
        buildableAssetUniqueName,
        text: question,
        selectedEmote,
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const onResetClues = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/reset-clues`)
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleAddNewClue = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/add-new-clue`)
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreButtonsDisabled(false);
      });
  };

  const handleOpenClueModal = (clue: ClueType) => {
    setSelectedClue(clue);
    setShowEditClueModal(true);
  };
  const handleCloseClueModal = () => {
    setSelectedClue(null);
    setShowEditClueModal(false);
  };

  const reloadClues = () => {
    setIsLoading(true);
    backendAPI
      .get(`/config`)
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  };

  const walkUpToClueAsset = async (clue: ClueType) => {
    setAreClueButtonsDisabled(true);
    backendAPI
      .post(`/walk-up-to-clue-asset`, { clue })
      .then(() => {
        setAreClueButtonsDisabled(false);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreClueButtonsDisabled(false);
      });
  };

  const removeClue = async () => {
    setAreClueButtonsDisabled(true);
    backendAPI
      .post(`/remove-clue`, { clue: selectedClue })
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => {
        setAreClueButtonsDisabled(false);
        setSelectedClue(null);
      });
  };

  const handleToggleShowConfirmationModal = () => {
    setShowConfirmationModal(!showConfirmationModal);
  };

  const Clue = ({ clue }: { clue: ClueType }) => {
    const { id, imgUrl, text } = clue;
    let imgSrc = imgUrl;
    if (imgUrl === "layers/textAssetPreview.png") {
      imgSrc = "https://topiaimages.s3.us-west-1.amazonaws.com/under-construction.png";
    }
    const truncatedText = text?.length > 18 ? `${text.substring(0, 15)}...` : text;

    return (
      <div className="card small mt-4 cursor-pointer" key={id} onClick={() => handleOpenClueModal(clue)}>
        <div className="card-image" style={{ height: "70px", width: "70px", minWidth: "70px" }}>
          <img src={imgSrc} style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
        <div className="card-details">
          <h4 className="card-title h4 mb-4">{truncatedText}</h4>
          <div className="card-actions" style={{ marginTop: "10px" }}>
            <button
              className="btn btn-icon"
              disabled={areClueButtonsDisabled}
              onClick={(event) => {
                event.stopPropagation();
                walkUpToClueAsset(clue);
              }}
            >
              <img src="https://sdk-style.s3.amazonaws.com/icons/walk.svg" />
            </button>
            <button
              className="btn btn-icon"
              disabled={areClueButtonsDisabled}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedClue(clue);
                handleToggleShowConfirmationModal();
              }}
            >
              <img src="https://sdk-style.s3.amazonaws.com/icons/delete.svg" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <div className="container items-center justify-start grid gap-4">
      <p>
        This is the final challenge question that the participants need to solve. Enter a question, and answer (non case
        sensitive) and click the save button.
      </p>
      <div>
        <label>Question</label>
        <input
          className="input"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setQuestion(event.target.value);
          }}
          type="textarea"
          value={question}
        />
      </div>

      <div>
        <label>Answer</label>
        <input
          className="input"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setAnswer(event.target.value?.trim()?.toLowerCase());
          }}
          value={answer}
        />
      </div>

      {currentTheme === "national-park" && (
        <div>
          <label>Buildable Asset Unique Name</label>
          <input
            className="input"
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setBuildableAssetUniqueName(event.target.value);
            }}
            value={buildableAssetUniqueName}
          />
        </div>
      )}

      <div>
        <label>Emote</label>
        <select
          value={selectedEmote}
          onChange={(e) => setSelectedEmote(e.target.value)}
          className="input"
          disabled={areButtonsDisabled || availableEmotes.length === 0}
        >
          <option value="">Select an emote</option>
          {availableEmotes.map((emote) => (
            <option key={emote.id} value={emote.id}>
              {emote.name}
            </option>
          ))}
        </select>
      </div>

      <button className="btn" onClick={onSave} disabled={areButtonsDisabled}>
        Save
      </button>

      <div className="mt-10">
        <h4>Clues</h4>
        <p>These are the configured clues. Click on one to take you to the clue.</p>
        {Object.keys(clues)?.map((clue) => <Clue clue={clues[clue]} />)}
        <button className="btn mt-4" onClick={handleAddNewClue} disabled={areButtonsDisabled}>
          Add New Clue
        </button>
        <button className="btn btn-danger mt-2" onClick={onResetClues} disabled={areButtonsDisabled}>
          Reset Clues
        </button>
      </div>
      {showEditClueModal && selectedClue && (
        <EditClueModal clue={selectedClue} onCloseModal={handleCloseClueModal} onCluesUpdated={reloadClues} />
      )}

      {showConfirmationModal && (
        <ConfirmationModal
          title="Remove Clue"
          message="Are you sure you want to remove this clue from the world? This action cannot be undone."
          handleOnConfirm={removeClue}
          handleToggleShowConfirmationModal={handleToggleShowConfirmationModal}
        />
      )}
    </div>
  );
};

export default Admin;
