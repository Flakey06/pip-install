import { useNavigate } from "react-router-dom";
import TabBar from "../components/TabBar";

export default function LumaWeb() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "90px" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="header-title">Luma</span>
        <div style={{ width: "20px" }} />
      </div>

      <div style={{ margin: "12px", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)" }}>
        <iframe
          src="https://luma.com"
          width="100%"
          height="760px"
          style={{ border: "none", display: "block" }}
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          title="Luma"
        />
      </div>

      <TabBar />
    </div>
  );
}
