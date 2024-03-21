// @ts-nocheck
type Props = {
  title: string;
  subTitle: string;
  items: listItems[];
  currentSelection?: number | -1;
  onClick?: (id: number) => void;
};

interface listItems {
  image: string;
  text: string;
  assetId?: string;
}

type ListItemProps = {
  image: string;
  text: string;
  selected: number;
  index: number;
  onClick?: (id: number) => void;
};

const ListItem = ({ image, text, selected, index, onClick }: ListItemProps) => {
  const truncate = text?.length > 30 ? `${text.substring(0, 30)}...` : text;
  return (
    <div key={index}>
      <button
        onClick={onClick ? () => onClick(index) : null}
        selected={selected === index}
      >
        <img
          src={image}
          style={{
            width: "56px",
            height: "56px",
            marginRight: "10px",
            objectFit: "contain",
          }}
        />
        <div>{truncate}</div>
        {selected === index ? (
          <div style={{ paddingLeft: "20%", fontSize: "1.5rem" }}>✅</div>
        ) : null}
      </button>
      <hr />
    </div>
  );
};

export const ListComponent = ({
  title,
  subTitle,
  items,
  currentSelection,
  onClick,
}: Props) => {
  function handleClick(index: number) {
    onClick && onClick(items[index]);
  }

  return (
    <>
      <div style={{ fontWeight: 600, paddingBottom: "20px" }}> {title} </div>
      <div>{subTitle}</div>
      {items.map((item, i) => (
        <ListItem
          image={item.image}
          index={i}
          onClick={handleClick}
          selected={currentSelection}
          text={item.text}
        />
      ))}
    </>
  );
};

export default ListComponent;
