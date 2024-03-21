import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// components
import { Loading } from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

export const Analytics = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [noOfClues, setNoOfClues] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getAnalytics() {
      try {
        await backendAPI.get(`/admin/analytics`).then((result) => {
            setNoOfClues(result.data.totalClues);
            setProgressData(result.data.analytics?.progress);
        }).finally(() => setIsLoading(false));
      } catch (error) {
        console.log(error);
        navigate("*");
        setIsLoading(false);
      }
    }
    getAnalytics();
  }, []);

  if (isLoading) return <Loading />;

  return (
    <>
      <div style={{ paddingBottom: "20px" }}>
        <div>Players who started: {progressData?.length || 0}</div>
        <div>Total clues (in world): {noOfClues} </div>
      </div>
      <hr />
      {progressData && (
        <table>
          <tr>
            <th>Username</th>
            <th align="right">Clues Found</th>
          </tr>
          {progressData.map((row: any) => (
            <tr key={row.profileId}>
              <td scope="row">{row.userName}</td>
              <td align="right">
                {row.cluesFound.length} {row.challengeDone ? "- Completed" : ""}
              </td>
            </tr>
          ))}
        </table>
      )}
    </>
  );
};

export default Analytics;
