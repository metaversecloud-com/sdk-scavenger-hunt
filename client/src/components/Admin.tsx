import { useEffect, useState, useContext } from "react";

// components
import { ConfirmationModal, EditClueModal, Loading } from "@/components";

// utils
import { backendAPI } from "@/utils/backendAPI";
import { setErrorMessage } from "@/utils/setErrorMessage";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import {
  ClueType,
  LeaderboardEntryType,
  QuestionTypeOption,
  SET_CONFIG,
  SET_CLUES,
  SET_CHALLENGE,
} from "@/context/types";
import { themeData } from "@/context/themeData";

export const Admin = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { theme, challenge, clues, totalClues, emotes, leaderboard } = useContext(GlobalStateContext);

  const [activeTab, setActiveTab] = useState<"settings" | "results">("settings");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [challengeImgUrl, setChallengeImgUrl] = useState("");
  const [challengeTitle, setChallengeTitle] = useState("");
  const [buildableAssetUniqueName, setBuildableAssetUniqueName] = useState("");
  const [selectedEmote, setSelectedEmote] = useState("");
  const [questionType, setQuestionType] = useState<QuestionTypeOption>("text");
  const [options, setOptions] = useState<{ [key: string]: string }>({
    "1": "",
    "2": "",
    "3": "",
    "4": "",
  });
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [showEditClueModal, setShowEditClueModal] = useState(false);
  const [selectedClue, setSelectedClue] = useState<ClueType | null>(null);
  const [areClueButtonsDisabled, setAreClueButtonsDisabled] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  useEffect(() => {
    backendAPI
      .get(`/config`)
      .then((result) => {
        const { clues, challenge, emotes, theme } = result.data;

        // Update local form state
        setQuestion(challenge.text || "");
        setAnswer(challenge.answer || "");
        setChallengeImgUrl(
          challenge?.imgUrl ||
            themeData?.[theme || ""]?.challengeTitleImgUrl ||
            `https://sdk-scavenger-hunt.s3.us-east-1.amazonaws.com/IMG_Start.png`,
        );
        setChallengeTitle(challenge.title || themeData?.[theme || ""]?.title || "");
        setSelectedEmote(challenge.selectedEmote || "");
        setQuestionType(challenge.questionType || "text");
        if (challenge.options) setOptions(challenge.options);
        if (challenge.correctAnswers) setCorrectAnswers(challenge.correctAnswers);

        // Update context
        dispatch!({
          type: SET_CONFIG,
          payload: {
            challenge: {
              imgUrl: challenge.imgUrl,
              title: challenge.title,
              text: challenge.text,
              answer: challenge.answer,
              selectedEmote: challenge.selectedEmote,
              lastUpdated: challenge.lastUpdated,
            },
            clues,
            emotes,
            theme,
          },
        });
      })
      .catch((error) => setErrorMessage(dispatch, error))
      .finally(() => setIsLoading(false));
  }, [dispatch]);

  const onSave = async () => {
    if (questionType === "text" && !answer.trim()) {
      setValidationError("Please provide an answer.");
      return;
    }
    if (questionType !== "text" && correctAnswers.length === 0) {
      setValidationError("Please select at least one correct answer.");
      return;
    }
    setValidationError("");
    setAreButtonsDisabled(true);
    backendAPI
      .post(`/update-challenge`, {
        answer: questionType === "text" ? answer : undefined,
        buildableAssetUniqueName,
        imgUrl: challengeImgUrl,
        title: challengeTitle,
        text: question,
        selectedEmote,
        questionType,
        options: questionType !== "text" ? options : undefined,
        correctAnswers: questionType !== "text" ? correctAnswers : undefined,
      })
      .then(() => {
        // Update context with new challenge data
        dispatch!({
          type: SET_CHALLENGE,
          payload: {
            challenge: {
              ...challenge,
              imgUrl: challengeImgUrl,
              title: challengeTitle,
              text: question,
              answer: questionType === "text" ? answer : undefined,
              selectedEmote,
              questionType,
              options: questionType !== "text" ? options : undefined,
              correctAnswers: questionType !== "text" ? correctAnswers : undefined,
            },
          },
        });
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
        dispatch!({
          type: SET_CLUES,
          payload: { clues: result.data.clues },
        });
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
        dispatch!({
          type: SET_CLUES,
          payload: { clues: result.data.clues },
        });
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
        dispatch!({
          type: SET_CLUES,
          payload: { clues: result.data.clues },
        });
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
        dispatch!({
          type: SET_CLUES,
          payload: { clues: result.data.clues },
        });
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

  const getResultsContent = () => (
    <div className="grid gap-4 items-center">
      {!leaderboard || leaderboard.length === 0 ? (
        <p>No results yet. Results will appear here as visitors participate in the scavenger hunt.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="card col-span-2 success">
              <h2>{leaderboard.filter((entry) => entry.challengeDone).length}</h2>
              <p className="p2">Completions</p>
            </div>
            <div className="card">
              <h2>{leaderboard.length}</h2>
              <p className="p2">Total Participants</p>
            </div>
            <div className="card">
              <h2>
                {(leaderboard.reduce((sum, entry) => sum + entry.cluesCollected, 0) / leaderboard.length).toFixed()}
              </h2>
              <p className="p2">Average # Found</p>
            </div>
          </div>
          <table className="table" style={{ position: "relative" }}>
            <thead>
              <tr>
                <th className="h6">Name</th>
                <th className="h6">Found</th>
                <th className="h6">Attempts</th>
                <th className="h6">Complete</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry: LeaderboardEntryType) => (
                <tr key={entry.profileId}>
                  <td className="p2">
                    <div className="tooltip" key={entry.profileId} style={{ maxWidth: "70px", zIndex: 1 }}>
                      <span className="tooltip-content" style={{ width: "115px", left: "50px" }}>
                        {entry.name}
                      </span>
                      <div className="truncate">{entry.name}</div>
                    </div>
                  </td>
                  <td className="p2">
                    {entry.cluesCollected} of {totalClues}
                  </td>
                  <td className="p2">{entry.answerAttempts}</td>
                  <td className="p2">{entry.challengeDone ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );

  const getSettingsContent = () => (
    <div className="container items-center justify-start grid gap-4">
      <div>
        <label>Title</label>
        <input
          className="input"
          placeholder="My Scavenger Hunt"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setChallengeTitle(event.target.value);
          }}
          value={challengeTitle}
        />
      </div>

      <div>
        <label>Challenge Image URL</label>
        <input
          className="input"
          placeholder="https://example.com/challenge-image.png"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setChallengeImgUrl(event.target.value);
          }}
          value={challengeImgUrl}
        />
        {challengeImgUrl && (
          <div className="mt-2 mb-2">
            <p className="p2 pb-2">Preview:</p>
            <img
              src={challengeImgUrl}
              alt="Challenge preview"
              className="m-auto"
              style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "contain" }}
            />
          </div>
        )}
      </div>

      <p>
        This is the final challenge question that the participants need to solve. Enter a question, and answer (non case
        sensitive) and click the save button.
      </p>

      <div>
        <label>Question Type</label>
        <select
          className="input"
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value as QuestionTypeOption)}
        >
          <option value="text">Text Answer</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="all_that_apply">All That Apply</option>
        </select>
      </div>

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

      {questionType === "text" ? (
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
      ) : (
        <div>
          <label>Options</label>
          <p className="p2 pb-2">
            {questionType === "multiple_choice"
              ? "Select the correct answer using the radio button."
              : "Select all correct answers using the checkboxes."}
          </p>
          {Object.keys(options).map((key) => (
            <div key={key} className="flex items-center mb-2">
              {questionType === "multiple_choice" ? (
                <input
                  type="radio"
                  name="correctAnswer"
                  checked={correctAnswers.includes(key)}
                  onChange={() => setCorrectAnswers([key])}
                  className="mr-2"
                  style={{ width: "20px", height: "20px" }}
                />
              ) : (
                <input
                  type="checkbox"
                  checked={correctAnswers.includes(key)}
                  onChange={() =>
                    setCorrectAnswers((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
                  }
                  className="mr-2"
                  style={{ width: "20px", height: "20px" }}
                />
              )}
              <input
                className="input flex-1"
                placeholder={`Option ${key}`}
                value={options[key]}
                onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      )}

      {theme === "national-park" && (
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
          disabled={areButtonsDisabled || !emotes || emotes.length === 0}
        >
          <option value="">Select an emote</option>
          {emotes?.map((emote) => (
            <option key={emote.id} value={emote.id}>
              {emote.name}
            </option>
          ))}
        </select>
      </div>

      <button className="btn" onClick={onSave} disabled={areButtonsDisabled}>
        Save
      </button>
      {validationError && <p className="text-error">{validationError}</p>}

      <div className="mt-10">
        <h4>Items</h4>
        <p>These are the configured items. Click on one to take you to the item.</p>
        {clues && Object.keys(clues)?.map((clueKey) => <Clue key={clueKey} clue={clues[clueKey]} />)}
        <button className="btn mt-4" onClick={handleAddNewClue} disabled={areButtonsDisabled}>
          Add New Item
        </button>
        <button className="btn btn-danger mt-2" onClick={onResetClues} disabled={areButtonsDisabled}>
          Reset Items
        </button>
      </div>
      {showEditClueModal && selectedClue && (
        <EditClueModal clue={selectedClue} onCloseModal={handleCloseClueModal} onCluesUpdated={reloadClues} />
      )}

      {showConfirmationModal && (
        <ConfirmationModal
          title="Remove Item"
          message="Are you sure you want to remove this item from the world? This action cannot be undone."
          handleOnConfirm={removeClue}
          handleToggleShowConfirmationModal={handleToggleShowConfirmationModal}
        />
      )}
    </div>
  );

  if (isLoading) return <Loading />;

  return (
    <>
      <div className="tab-container mb-4">
        <button className={activeTab === "settings" ? "btn" : "btn btn-text"} onClick={() => setActiveTab("settings")}>
          Settings
        </button>
        <button className={activeTab === "results" ? "btn" : "btn btn-text"} onClick={() => setActiveTab("results")}>
          Results
        </button>
      </div>

      {activeTab === "settings" ? getSettingsContent() : getResultsContent()}
    </>
  );
};

export default Admin;
