import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";
import EditClue from "./EditClue";

export const Configurations = () => {
  const navigate = useNavigate();
  const [clues, setClues] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [buildableAssetUniqueName, setBuildableAssetUniqueName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [areButtonsDisabled, setAreButtonsDisabled] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClue, setSelectedClue] = useState(null);

  useEffect(() => {
    backendAPI.get(`/config`)
      .then((result: any) => {
        const { clues, challenge } = result.data
        setQuestion(challenge.text);
        setAnswer(challenge.answer);
        setClues(clues);
      })
      .catch(() => navigate("*"))
      .finally(() => setIsLoading(false));
  }, []);

  const onSave = async () => {
    setAreButtonsDisabled(true);
    backendAPI.post(`/update-challenge`, {
      answer,
      buildableAssetUniqueName,
      text: question,
    })
      .catch(() => navigate("*"))
      .finally(() => setAreButtonsDisabled(false));
  };

  const onResetClues = async () => {
    setAreButtonsDisabled(true);
    backendAPI.post(`/reset-clues`)
      .then((result: any) => {
        setClues(result.data.clues);
      })
      .catch(() => navigate("*"))
      .finally(() => setAreButtonsDisabled(false));
  };

  const handleOpenClueModal = (clue: any) => {
    setSelectedClue(clue);
    setIsModalVisible(true);
  };
  const handleCloseClueModal = () => {
    setSelectedClue(null);
    setIsModalVisible(false);
  };

  const Clue = ({ item }: { item: any }) => {
    const { assetId, imageUrl, text } = item;
    const truncatedText =
      text?.length > 30 ? `${text.substring(0, 30)}...` : text;
    return (
      <div
        className="card small mt-4 cursor-pointer"
        key={assetId}
        onClick={() => handleOpenClueModal(item)}
      >
        <div
          className="card-image"
          style={{ height: "70px", width: "70px", minWidth: "70px" }}
        >
          <img src={imageUrl} style={{ maxWidth: "100%", maxHeight: "100%" }} />
        </div>
        <div className="card-title">{truncatedText}</div>
      </div>
    );
  };

  if (isLoading) return <Loading />;

  return (
    <>
      <p className="mb-4">
        This is the final challenge question that the participants need to
        solve. Enter a question, and answer (non case sensitive) and click the
        save button.
      </p>
      <label>Question</label>
      <input
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setQuestion(event.target.value);
        }}
        type="textarea"
        style={{ width: "100%" }}
        value={question}
      />

      <label>Answer</label>
      <input
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setAnswer(event.target.value);
        }}
        style={{ width: "100%" }}
        value={answer}
      />

      <label>Buildable Asset Unique Name</label>
      <input
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setBuildableAssetUniqueName(event.target.value);
        }}
        style={{ width: "100%" }}
        value={buildableAssetUniqueName}
      />
      <button className="mt-4" onClick={onSave} disabled={areButtonsDisabled}>
        Save
        </button>

      <div className="mt-10">
        <h4>Clues</h4>
        <p>
          These are the configured clues. Click on one to take you to the
          clue.
          </p>
        {Object.keys(clues).map((item: any) => (
          <Clue item={clues[item]} />
        ))}
        <button className="mt-4" onClick={onResetClues} disabled={areButtonsDisabled}>
          Reset Clues
        </button>
      </div>

      {isModalVisible && selectedClue && (
        <EditClue clue={selectedClue} onCloseModal={handleCloseClueModal} />
      )}
    </>
  );
};

export default Configurations;
