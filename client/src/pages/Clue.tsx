import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

const Clue = () => {
  const navigate = useNavigate();
  const [cluesFound, setCluesFound] = useState<string>("");
  const [totalClues, setTotalClues] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [keyAssetImage, setKeyAssetImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getClue();
  }, []);

  const getClue = async () => {
    try {
      console.log("hello21")
      const result = await backendAPI.get(`/clue`);
        const { cluesFound, totalClues, imageUrl, text, keyAssetImage } = result.data;
        setCluesFound(cluesFound);
        setTotalClues(totalClues);
        setImageUrl(imageUrl);
        setText(text);
        setKeyAssetImage(keyAssetImage);
    } catch (error) {
      console.error("error", error);
      navigate("*");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <div className="container p-6">
      <div style={{ padding: "10px", textAlign: "center" }}>
        <h3 style={{ marginBottom: "5px" }}>Congratulations!</h3>
        <div> You have found a clue!</div>
        <div>
          Completed {cluesFound} of {totalClues}
        </div>
      </div>
      <div className="container mt-6">
        <img
          className="m-auto"
          style={{ maxHeight: "300px", borderRadius: "10%" }}
          src={imageUrl}
        />
        <div
          style={{ maxWidth: "80%", paddingTop: "1rem", textAlign: "center" }}
        >
          {text}
        </div>
        {cluesFound === totalClues && (
          <div className="container mt-10 flex items-center justify-start">
            <div className="flex flex-col">
              <img src={keyAssetImage} />
            </div>
            <div className="flex flex-col">
              Great Job! You have unlocked the final challenge question. Go
              back, to the first sign to continue.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clue;
