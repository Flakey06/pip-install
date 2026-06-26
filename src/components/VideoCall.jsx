// file use: Jitsi Meet integration — generates room URL, sends system message
import { useState } from "react";

export default function VideoCall({ groupId, groupName, onClose }) {
  const [joined, setJoined] = useState(false);
  const roomName = `pip-install-${groupId}`;
  const roomUrl = `https://meet.jit.si/${roomName}`;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinCall = () => {
    window.open(roomUrl, "_blank");
    setJoined(true);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "24px 24px 0 0",
        padding: "24px", width: "100%", maxWidth: "480px",
        paddingBottom: "48px",
        border: "1.5px solid var(--border-sketch)",
        animation: "fadeUp 0.3s ease"
      }}>

        <div style={{ width: "40px", height: "4px", background: "var(--border-sketch)", borderRadius: "2px", margin: "0 auto 24px" }} />

        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>📹</div>
          <h3 className="display-font" style={{ fontSize: "22px", color: "var(--text)", marginBottom: "4px" }}>
            Video Call
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            {groupName || "Group Chat"}
          </p>
        </div>

        <div className="card" style={{ marginBottom: "20px", padding: "16px" }}>
          <p className="section-label">Room link</p>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            marginTop: "6px"
          }}>
            <p style={{
              flex: 1, fontSize: "13px", color: "var(--purple-dark)",
              fontWeight: "600", wordBreak: "break-all",
              background: "var(--purple-light)", padding: "8px 12px",
              borderRadius: "8px", margin: 0
            }}>
              {roomUrl}
            </p>
            <button onClick={copyLink} style={{
              background: copied ? "var(--purple-dark)" : "var(--purple-light)",
              border: "none", borderRadius: "8px", padding: "8px 12px",
              cursor: "pointer", fontSize: "13px", fontWeight: "700",
              color: copied ? "white" : "var(--purple-dark)",
              transition: "all 0.2s ease", flexShrink: 0
            }}>
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
          </div>
        </div>

        <div style={{
          padding: "12px 14px", borderRadius: "12px",
          background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)",
          marginBottom: "20px"
        }}>
          <p style={{ fontSize: "13px", color: "#854F0B", margin: 0, lineHeight: "1.6" }}>
            💡 Share this link with your group members — anyone with the link can join!
            The call opens in a new tab via Jitsi Meet (free, no account needed).
          </p>
        </div>

        <div style={{ marginBottom: "24px" }}>
          {[
            { step: "1", text: "Click Join Call below" },
            { step: "2", text: "Share the room link with your group" },
            { step: "3", text: "Everyone clicks the link to join" },
          ].map(item => (
            <div key={item.step} style={{
              display: "flex", alignItems: "center", gap: "12px",
              marginBottom: "10px"
            }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--purple-mid), var(--purple-dark))",
                color: "white", fontSize: "13px", fontWeight: "800",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: "2px 2px 0px var(--purple-dark)"
              }}>
                {item.step}
              </div>
              <p style={{ fontSize: "14px", color: "var(--text)", margin: 0, fontWeight: "500" }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button className="btn-primary" onClick={joinCall} style={{ fontSize: "16px", padding: "16px" }}>
            {joined ? "🔁 Rejoin Call" : "📹 Join Call"}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
