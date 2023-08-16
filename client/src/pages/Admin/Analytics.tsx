import { Divider, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";

function Analytics() {
  console.log("window.location.search", document.location.search);
  const [progressData, setProgressData] = useState([]);
  const [noOfClues, setNoOfClues] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getAnalytics() {
      const res = await axios.get(`/backend/admin/analytics${window.location.search}`);
      setNoOfClues(res.data.totalClues);
      setProgressData(res.data.analytics.progress);
      setLoading(false)
    }

    getAnalytics();
  }, []);

  if(loading) return <div style={{padding: "20px"}}><LinearProgress /></div>

  return (
    <div style={{ backgroundColor: "white", padding: "10px" }}>
      <h3>Analytics</h3>
      <div style={{paddingBottom: "20px"}}>
        <div>Players who started: {progressData.length}</div>
        <div>Total clues (in world): {noOfClues} </div>
      </div>
      <Divider />
      <TableContainer sx={{pt: 2}}>
        <Table aria-label="simple table">
          <TableHead sx={{bgcolor: "#DEE2E5"}}>
            <TableRow >
              <TableCell sx={{fontWeight: 600}}>Username</TableCell>
              <TableCell align="right" sx={{fontWeight: 600}}>Clues Found</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {progressData.map((row) => (
              <TableRow key={row.studentId} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                <TableCell component="th" scope="row">
                  {row.userName}
                </TableCell>
                <TableCell align="right">
                {row.cluesFound.length} {row.challengeDone ? "- Completed" : ""}  
                  {/* {row.cluesFound.length} {row.cluesFound.length === noOfClues ? "- Completed" : ""} */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}

export default Analytics;
