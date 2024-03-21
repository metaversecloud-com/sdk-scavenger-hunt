import { useEffect, useState } from "react";

// components
import { Loading } from "@/components/Loading";

// utils
import { backendAPI } from "@/utils/backendAPI";

export const Analytics = () => {
  const [progressData, setProgressData] = useState([]);
  const [noOfClues, setNoOfClues] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAnalytics() {
      const res = await backendAPI.get(`/admin/analytics`);
      setNoOfClues(res.data.totalClues);
      setProgressData(res.data.analytics.progress);
      setLoading(false);
    }

    getAnalytics();
  }, []);

  if (loading) return <Loading />;

  return (
    <div style={{ backgroundColor: "white", padding: "10px" }}>
      <h3>Analytics</h3>
      <div style={{ paddingBottom: "20px" }}>
        <div>Players who started: {progressData.length}</div>
        <div>Total clues (in world): {noOfClues} </div>
      </div>
      <hr />
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
    </div>
  );
};

export default Analytics;
