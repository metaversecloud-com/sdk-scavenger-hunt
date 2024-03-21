import { useEffect, useState } from "react";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";
import EditClue from "./EditClue";

export const Configurations = () => {
  const [clues, setClues] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClue, setSelectedClue] = useState(null);

  useEffect(() => {
    const getConfigList = async () => {
      const res = await backendAPI.get(`/admin/config`);

      console.log("🚀 ~ file: Configurations.tsx:23 ~ res:", res.data)
      const clues = res.data.clues.map(
        (asset: { imageUrl: any; text: any; id: any }, i: number) => {
          return {
            imageUrl: asset.imageUrl,
            text: asset.text || `Clue ${i + 1}`,
            assetId: asset.id,
          };
        }
      );

      setQuestion(res.data.challenge.text);
      setAnswer(res.data.challenge.answer);
      setClues(clues);
      setLoading(false);
    };

    getConfigList();
  }, []);

  const onSave = async () => {
    setSaving(true);
    await backendAPI.post(`/admin/updateChallenge`, {
      text: question,
      answer,
    });
    setSaving(false);
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
    const { assetId, image, text } = item;
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
          <img src={image} />
        </div>
        <div className="card-title">{truncatedText}</div>
      </div>
    );
  };

  if (loading) return <Loading />;

  return (
    <>
      <h4>Final Question</h4>
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
      <div className="card-actions">
        <button className="mt-4" onClick={onSave} disabled={saving}>
          Save
        </button>
      </div>

      <div className="container mt-10 flex items-center justify-start">
        <div className="flex flex-col">
          <h4>Clues</h4>
          <p>
            These are the configured clues. Click on one to take you to the
            clue.
          </p>
          {clues.map((item) => (
            <Clue item={item} />
          ))}
        </div>
      </div>

      {isModalVisible && selectedClue && (
        <EditClue clue={selectedClue} onCloseModal={handleCloseClueModal} />
      )}
    </>
  );
};

export default Configurations;
