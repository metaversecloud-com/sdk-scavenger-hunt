import React from "react";
import ReactDOM from "react-dom/client";
import Clue from "./pages/Clue.tsx";
import Challenge from "./pages/Admin/Challenge.tsx";
import Configurations from "./pages/Admin/Configs/Configurations.tsx";
import Analytics from "./pages/Admin/Analytics.tsx";
import ListClues from "./pages/Admin/Configs/ListClues.tsx";
import ClueCongif from "./pages/Admin/Configs/Clue.tsx";

import Admin from "./pages/Admin/Admin.tsx";
import "./index.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  { path: "clue", element: <Clue /> },
  { path: "challenge", element: <Challenge /> },
  {
    path: "admin",
    element: <Admin />,
    children: [
      { path: "analytics", index: true, element: <Analytics /> },
      {
        path: "configuration",
        element: <Configurations />,
        children: [
          { path: "", element: <ListClues />, index: true },
          { path: "clue/:id", element: <ClueCongif /> },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
      <RouterProvider router={router} />
    {/* <App /> */}
  </React.StrictMode>,
);
