import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TabBar from "../components/TabBar";

export default function Luma() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const lumaApiKey = import.meta.env.VITE_LUMA_API_KEY || "";
  const isConfigured = Boolean(lumaApiKey);
  const maskedKey = isConfigured
    ? `${lumaApiKey.slice(0, 8)}...${lumaApiKey.slice(-4)}`
    : "Not configured";

  const handleCopy = async () => {
    if (!lumaApiKey) return;
    try {
      await navigator.clipboard.writeText(lumaApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

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

      <div style={{ margin: "16px", padding: "20px", background: "var(--card)", borderRadius: "18px", border: "1px solid var(--border)" }}>
        <p style={{ margin: "0 0 8px", fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Status
        </p>
        <div style={{
          display: "inline-block",
          padding: "8px 12px",
          borderRadius: "999px",
          background: isConfigured ? "#dcfce7" : "#fef2f2",
          color: isConfigured ? "#15803d" : "#b91c1c",
          fontSize: "13px",
          fontWeight: "700",
          marginBottom: "14px"
        }}>
          {isConfigured ? "Configured" : "Missing"}
        </div>

        <p style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--text-muted)" }}>
          Your Luma API key
        </p>
        <div style={{
          padding: "12px 14px",
          borderRadius: "12px",
          background: "var(--input-bg)",
          border: "1px solid var(--border)",
          fontSize: "14px",
          fontFamily: "monospace",
          wordBreak: "break-all"
        }}>
          {maskedKey}
        </div>

        <button onClick={handleCopy} disabled={!isConfigured} style={{
          marginTop: "12px",
          border: "none",
          borderRadius: "10px",
          padding: "10px 14px",
          background: isConfigured ? "var(--purple-dark)" : "var(--input-bg)",
          color: isConfigured ? "var(--bg)" : "var(--text-muted)",
          fontWeight: "700",
          cursor: isConfigured ? "pointer" : "default"
        }}>
          {copied ? "Copied!" : isConfigured ? "Copy full key" : "No key set"}
        </button>

        {!isConfigured && (
          <p style={{ marginTop: "12px", fontSize: "14px", color: "var(--text-muted)" }}>
            Add VITE_LUMA_API_KEY to your environment file and restart the app.
          </p>
        )}
      </div>

      <TabBar />
    </div>
  );
}
