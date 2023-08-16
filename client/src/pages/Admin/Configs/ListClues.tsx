import { useNavigate } from "react-router-dom";
import ListComponent from "../../../components/ListComponent";
import { useConfig } from "./Configurations";
import { Box } from "@mui/material";
function ListClues() {
  const { assets } = useConfig();
  const navigate = useNavigate();

  function handleClick(item) {
    navigate(`/admin/configuration/clue/${item.assetId}${document.location.search}`);
  }

  return (
    <Box sx={{ flexDirection: "column", display: "flex", gap: 2, border: "1px solid grey", p: 2, mt: 2, mx: 1 }}>
      <ListComponent
        title="Clue"
        subTitle="These are the configured clues. Click on one to take you to the clue."
        items={assets}
        onClick={handleClick}
      />
    </Box>
  );
}

export default ListClues;
