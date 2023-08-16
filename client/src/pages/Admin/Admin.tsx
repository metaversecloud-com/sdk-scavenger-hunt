import { Divider } from "@mui/material";
import { useEffect } from "react";
import axios from "axios";
import { Link, Outlet } from "react-router-dom";

// const scavengerHunt = {
//   target: {
//     img: "",
//     text: "",
//     droppedAssetID: "",
//   },
//   clues: [
//     {
//       droppedAssetID: "",
//       text: "",
//       img: "",
//     },
//   ],

//   analytics: {},
// };

// const clueMockData = [
//   {
//     image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_1.png",
//     text: "Clue one",
//     selected: 10,
//     index: 10,
//   },
//   {
//     image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_2.png",
//     text: "Clue two",
//     selected: 10,
//     index: 10,
//   },
//   {
//     image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_4.png",
//     text: "Clue three",
//     selected: 10,
//     index: 10,
//   },
// ];

// const challengeMock = [
//   {
//     image: "https://topia-scavenger-hunt.s3.us-east-2.amazonaws.com/IMG_3.png",
//     text: "Question",
//     selected: 1,
//     index: 1,
//   },
// ];

// const targetImages = [];

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
