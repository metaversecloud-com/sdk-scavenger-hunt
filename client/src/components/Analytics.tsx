import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

// components
import { Loading } from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { SET_THEME } from "@/context/types";

type ProgressType = {
  [key: string]: { challengeDone: boolean; cluesFound: string[]; profileId: string; username: string };
};

export const Analytics = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const navigate = useNavigate();
  const context = useContext(GlobalStateContext);

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
            payload: theme,
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
      <table style={{ fontSize: "12px" }}>
        <tr>
          <th>Username</th>
          <th align="right">Clues Found</th>
        </tr>
        {Object.keys(progressData).map((row: any) => (
          <tr key={progressData?.[context?.profileId]?.cluesFound?.length}>
            <td scope="row">{progressData?.[context?.profileId]?.username}</td>
            <td align="right">
              {progressData?.[context?.profileId]?.cluesFound?.length || 0}{" "}
              {progressData?.[context?.profileId]?.challengeDone ? "- Completed" : ""}
            </td>
          </tr>
        ))}
      </table>
    </>
  );
};

export default Analytics;
