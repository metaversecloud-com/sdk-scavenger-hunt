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
  const [contentImgUrl, setContentImgUrl] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [keyAssetImage, setKeyAssetImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getClue();
  }, [backendAPI]);

  const getClue = async () => {
    setIsLoading(true);
    backendAPI.get(`/clue`).then((result: any) => {
      const { success, cluesFound, totalClues, imageUrl, contentImgUrl, text, keyAssetImage } = result.data;
      if (success) {
        setCluesFound(cluesFound);
        setTotalClues(totalClues);
        setImageUrl(imageUrl);
        setContentImgUrl(contentImgUrl);
        setText(text);
        setKeyAssetImage(keyAssetImage);
        setIsLoading(false);
      }
    })
      .catch(() => navigate("*"))
      .finally(() => setIsLoading(false));
  };

  if (isLoading || !cluesFound) return <Loading />;

  return (
    <div className="container p-6">
      <div className="text-center" style={{marginBottom: "70px"}}>
        <img 
          className="mx-auto rounded-xl mb-4" 
          style={{ maxWidth: "100%", maxHeight: "400px" }} 
          src={imageUrl} 
          alt="Clue" 
        />
        <h3 className="text-2xl font-bold mb-2">Congratulations!</h3>
        <p className="text-lg">
          You have found a clue! 
        </p>
        <p className="text-lg">
          Completed {cluesFound} of {totalClues}
        </p>
      </div>
  
      {cluesFound === totalClues ? (
        <div className="mb-8">
          <img
            className="mx-auto rounded-xl mb-4"
            style={{ maxWidth: "100%", maxHeight: "400px" }}
            src={contentImgUrl}
            alt="Final Challenge"
          />
          <div style={{textAlign: "center"}}>{text}</div>
         <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mt-8" role="alert">
            <p>Congratulations! You have unlocked the final challenge question.</p>
            <p>Please return to the first sign to continue.</p>
          </div>
        </div>
      ) : (
        <p className="text-center text-xl">{text}</p>
      )}
    </div>
  );
};

export default Clue;
