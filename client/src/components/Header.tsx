import { Link } from "react-router-dom";

export const Header = ({ activeTab, text }: { activeTab?: string; text?: string }) => {
  return (
    <div className="container p-6">
      <div className="tab-container">
        <button className={activeTab === "challenge" ? "btn " : "btn btn-text"}>
          <Link to={`/challenge`}>Challenge</Link>
        </button>
        <button className={activeTab === "admin" ? "btn " : "btn btn-text"}>
          <Link to={`/admin`}>Admin</Link>
        </button>
      </div>
      {text && (
        <div className="flex flex-col mb-6 mt-6">
          <h3 style={{ marginBottom: "0px" }}>{text}</h3>
        </div>
      )}
    </div>
  );
};

export default Header;
