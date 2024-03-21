import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

// components
import Loading from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

const Clue = () => {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getClue = async () => {
      const res = await backendAPI.get(`/clue`);
      console.log("🚀 ~ file: Clue.tsx:21 ~ res.data:", res.data);
      setData(res.data);
      setLoading(false);
    };
    getClue();
  }, [id]);

  if (loading) return <Loading />;

  return (
    <div className="container p-6">
      <div style={{ padding: "10px", textAlign: "center" }}>
        <h3 style={{ marginBottom: "5px" }}>Congratulations!</h3>
        <div> You have found a clue!</div>
        <div>
          Completed {data.cluesFound} of {data.totalClues}
        </div>
      </div>
      <div className="container mt-6">
        <img
          style={{ height: "300px", width: "300px", borderRadius: "10%" }}
          src={data.image}
        />
        <div
          style={{ maxWidth: "80%", paddingTop: "1rem", textAlign: "center" }}
        >
          {data.text}
        </div>
        {data.cluesFound === data.totalClues && (
          <div className="container mt-10 flex items-center justify-start">
            <div className="flex flex-col">
              <img src={data.keyAssetImage} />
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
