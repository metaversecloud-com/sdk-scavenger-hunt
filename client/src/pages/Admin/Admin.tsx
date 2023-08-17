import { Divider } from "@mui/material";
import { Link, Outlet } from "react-router-dom";

function App() {

  return (
    <>
      <h1>Admin Menu</h1>
      <Divider />
      <div style={{ padding: "10px" }}>
        <h3>Instructions</h3>
        <div>
          Here you can configure the scavenger hunt and view analytics. Click on one
          of the links below to get started!
        </div>
      </div>
      <div style={{padding: "5px", paddingBottom: "20px"}}>
        <div style={{ display: "flex", flexDirection: "column", paddingTop: "1rem" }}>
          <Link to={`/admin/configuration${document.location.search}`}>Configure</Link>
          <Link to={`/admin/analytics${document.location.search}`}>View Analytics</Link>
        </div>
      </div>
      <Divider />
      <Outlet />
    </>
  );
}

export default App;
