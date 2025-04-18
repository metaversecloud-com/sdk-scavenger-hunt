import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// components
import { Loading } from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context
import { GlobalDispatchContext } from "@/context/GlobalContext";
import { SET_THEME } from "@/context/types";

type ProgressType = {
  [key: string]: { challengeDone: boolean; cluesFound: string[]; profileId: string; username: string };
};

export const Analytics = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();

  const [progressData, setProgressData] = useState<ProgressType>({});
  const [totalClues, setTotalClues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    backendAPI
      .get(`/progress`)
      .then((result) => {
        const { totalClues, progress, success, theme } = result.data;
        if (success) {
          setTotalClues(totalClues);
          setProgressData(progress);
          dispatch!({
            type: SET_THEME,
            payload: { theme },
          });
        }
      })
      .catch(() => navigate("*"))
      .finally(() => setIsLoading(false));
  }, [backendAPI]);

  if (isLoading || !progressData) return <Loading />;

  return (
    <>
      <div style={{ paddingBottom: "20px" }}>
        <div>Players who started: {Object.keys(progressData).length || 0}</div>
        <div>Total clues (in world): {totalClues} </div>
      </div>
      <hr />
      <table className="table">
        <tr>
          <th>Username</th>
          <th align="right">Clues Found</th>
        </tr>
        {Object.keys(progressData).map((profileId) => (
          <tr key={progressData?.[profileId]?.cluesFound?.length}>
            <td scope="row">{progressData?.[profileId!]?.username}</td>
            <td align="right">
              {progressData?.[profileId]?.cluesFound?.length || 0}{" "}
              {progressData?.[profileId]?.challengeDone ? "- Completed" : ""}
            </td>
          </tr>
        ))}
      </table>
    </>
  );
};

export default Analytics;
