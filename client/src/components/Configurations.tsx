import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";
import EditClue from "./EditClue";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { ClueType, SET_THEME } from "@/context/types";

export const Configurations = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();
  const [clues, setClues] = useState<{ [id: string]: ClueType }>({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [currentTheme, setTheme] = useState("robot");
  const [buildableAssetUniqueName, setBuildableAssetUniqueName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [isEditClueVisible, setIsEditClueVisible] = useState(false);
  const [selectedClue, setSelectedClue] = useState<ClueType | null>(null);
  const [allWalkButtonsDisabled, setAllWalkButtonsDisabled] = useState(false);

  useEffect(() => {
    backendAPI
      .get(`/config`)
      .then((result) => {
        const { clues, challenge, theme, success } = result.data;
        if (success) {
          setQuestion(challenge.text);
          setAnswer(challenge.answer);
          setClues(clues);
          setTheme(theme);
          if (dispatch) {
            dispatch({
              type: SET_THEME,
              payload: { theme },
            });
          }
        }
      })
      .catch(() => navigate("*"))
      .finally(() => setIsLoading(false));
  }, [backendAPI, dispatch]);

  const onSave = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/update-challenge`, {
        answer,
        buildableAssetUniqueName,
        text: question,
      })
      .catch(() => navigate("*"))
      .finally(() => setAreButtonsDisabled(false));
  };

  const onResetClues = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/reset-clues`)
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch(() => navigate("*"))
      .finally(() => setAreButtonsDisabled(false));
  };

  const handleAddNewClue = async () => {
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/add-new-clue`)
      .then((result) => {
        setClues(result.data.clues);
      })
      .catch(() => navigate("*"))
      .finally(() => setAreButtonsDisabled(false));
  };

  const handleOpenClueModal = (clue: ClueType) => {
    setSelectedClue(clue);
    setIsEditClueVisible(true);
  };
  const handleCloseClueModal = () => {
    setSelectedClue(null);
    setIsEditClueVisible(false);
  };

  const reloadClues = () => {
    setIsLoading(true);
    backendAPI
      .get(`/config`)
      .then((result) => {
        const { clues } = result.data;
        setClues(clues);
      })
      .catch(() => navigate("*"))
      .finally(() => setIsLoading(false));
  };

  const walkUpToClueAsset = async (clue: ClueType) => {
    setAllWalkButtonsDisabled(true);
    backendAPI
      .post(`/walk-up-to-clue-asset`, { clue })
      .then((result) => {
        if (result?.data?.success) {
          setAllWalkButtonsDisabled(false);
        }
      })
      .catch((error) => {
        console.error(error);
        setAllWalkButtonsDisabled(false);
      });
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
              className="btn btn-icon cursor-pointer"
              onClick={(event) => {
                event.stopPropagation();
                walkUpToClueAsset(clue);
              }}
              disabled={allWalkButtonsDisabled}
            >
              <img
                src="https://sdk-scavenger-hunt.s3.amazonaws.com/footsteps.svg"
                style={{ width: "14px", maxWidth: "14px" }}
              />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) return <Loading />;

  if (isEditClueVisible && selectedClue) {
    return <EditClue clue={selectedClue} onCloseModal={handleCloseClueModal} onCluesUpdated={reloadClues} />;
  }

  return (
    <>
      <p className="pb-4">
        This is the final challenge question that the participants need to solve. Enter a question, and answer (non case
        sensitive) and click the save button.
      </p>
      <label>Question</label>
      <input
        className="input"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setQuestion(event.target.value);
        }}
        type="textarea"
        value={question}
      />

      <label>Answer</label>
      <input
        className="input"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setAnswer(event.target.value?.trim()?.toLowerCase());
        }}
        value={answer}
      />

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

      <button className="btn mt-4" onClick={onSave} disabled={areButtonsDisabled}>
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
    </>
  );
};

export default Configurations;
