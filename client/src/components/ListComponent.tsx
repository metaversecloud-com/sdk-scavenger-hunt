import List from "@mui/material/List";
import { ListItem, ListItemButton } from "@mui/material";
import Divider from "@mui/material/Divider";


type Props = {
  title: string;
  subTitle: string;
  items: listItems[];
  currentSelection?: number | -1;
  onClick?: (id) => void;
};

interface listItems{
    image: string;
    text: string;
    assetId?: string;
}

type ListItemProps = {
  image: string;
  text: string;
  selected: number;
  index: number;
  onClick?: (id) => void;
};

function GetListItem({ image, text, selected, index, onClick }: ListItemProps) {
  const truncate = text?.length > 30 ? `${text.substring(0, 30)}...` : text;
  return (
    <div key={index}>
      <ListItemButton
        onClick={onClick ? () => onClick(index) : null}
        selected={selected === index}
        alignItems="center"
        sx={{ height: "90px", paddingLeft: "16px", paddingRight: "16px" }}
      >
        <img src={image} style={{ width: "56px", height: "56px", marginRight: "10px", objectFit: "contain" }} />
        <div>{truncate}</div>
        { selected === index ? <div style={{paddingLeft: "20%", fontSize: "1.5rem"}}>✅</div> : null}
      </ListItemButton>
      <Divider sx={{ backgroundColor: "#ebedef" }} />
    </div>
  );
}

function ListComponent({ title, subTitle, items, currentSelection, onClick }: Props) {
//   const [selected, setSelected] = useState(10);

  function handleClick(id) {
    console.log(id)
    onClick(items[id]);
  }
  return (
    <>
      <List sx={{ width: "100%", bgcolor: "background.paper" }}>
        <ListItem sx={{ flexDirection: "column", alignItems: "flex-start", minHeight: "60px" }}>
          <div style={{ fontWeight: 600, paddingBottom: "20px" }}> {title} </div>
          <div>{subTitle}</div>
        </ListItem>
        {items.map((item, i) => (
          <GetListItem image={item.image} text={item.text} selected={currentSelection} index={i} onClick={handleClick}/>
        ))}
      </List>
    </>
  );
}

export default ListComponent;
