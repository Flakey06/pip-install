// code contains: pip coins, includes balance, unlock group slots, earn history

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { spendCredits, UNLOCK_COSTS } from "../hooks/useCredits";

export default function Credits() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (snap.exists()) setProfile(snap.data());
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleUnlock = async (slot, cost) => {
    const result = await spendCredits(cost, slot);
    if (result.success) {
      setMessage(`Unlocked! You can now join up to ${slot} groups.`);
      await fetchProfile();
    } else if (result.reason === "not_enough") {
      setMessage(`Need ${cost} 🪙 — play games to earn more!`);
    } else if (result.reason === "already_unlocked") {
      setMessage(`Already unlocked!`);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  const credits = profile?.credits || 0;
  const maxGroups = profile?.maxGroups || 5;
  const history = [...(profile?.creditHistory || [])].reverse().slice(0, 5);

  const SLOTS = [
    { slot: 6, cost: UNLOCK_COSTS.slot_6, label: "6th Group Slot", desc: "Join one more group" },
    { slot: 7, cost: UNLOCK_COSTS.slot_7, label: "7th Group Slot", desc: "For the social butterfly" },
    { slot: 8, cost: UNLOCK_COSTS.slot_8, label: "8th Group Slot", desc: "Maximum connections" },
  ];

  const HOW_TO_EARN = [
    { icon: "☀️", label: "Daily login", coins: 5 },
    { icon: "🗳️", label: "Vote in Would You Rather", coins: 2 },
    { icon: "🧠", label: "Participate in Trivia", coins: 3 },
    { icon: "✅", label: "Correct Trivia answer", coins: 10 },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "40px" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">pip coins 🪙</span>
        <div style={{ width: "20px" }} />
      </div>

      
      <div style={{ margin: "16px", padding: "28px 20px", background: "var(--purple-dark)", borderRadius: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)", margin: "0 0 8px", fontFamily: "Inter, sans-serif", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Your Balance
        </p>
        <p style={{ fontSize: "56px", fontWeight: "800", margin: "0 0 4px", fontFamily: "Inter, sans-serif", color: "var(--bg)" }}>
          {credits}
        </p>
        <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.5)", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>pip coins 🪙</p>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 16px", display: "inline-block" }}>
          <span style={{ fontSize: "14px", fontFamily: "Inter, sans-serif", color: "rgba(255,255,255,0.8)" }}>
            Group limit: <strong style={{ color: "var(--bg)" }}>{maxGroups} groups</strong>
          </span>
        </div>
      </div>

      {message && (
        <div style={{
          margin: "0 16px 16px", padding: "12px 14px", borderRadius: "10px",
          background: message.startsWith("✅") ? "#f0fdf4" : "#fff5f5",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#15803d" : "#dc2626",
          fontSize: "14px", fontFamily: "Inter, sans-serif", fontWeight: "600"
        }}>
          {message}
        </div>
      )}

      {/* to unlock more slots, logic tbc*/}
      <p className="section-label">Unlock More Slots</p>
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "8px" }}>
        {SLOTS.map(({ slot, cost, label, desc }) => {
          const unlocked = maxGroups >= slot;
          const canAfford = credits >= cost;
          return (
            <div key={slot} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "14px 16px", borderRadius: "14px",
              border: `1px solid ${unlocked ? "#bbf7d0" : "var(--border)"}`,
              background: unlocked ? "#f0fdf4" : "#fafafa"
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: unlocked ? "#dcfce7" : "#f0f0f0",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", flexShrink: 0
              }}>
                {unlocked ? "✅" : "🔒"}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>{label}</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                  {unlocked ? "Unlocked ✓" : `${cost} 🪙 · ${desc}`}
                </p>
              </div>
              {!unlocked && (
                <button onClick={() => handleUnlock(slot, cost)} disabled={!canAfford} style={{
                  background: canAfford ? "#0f0f0f" : "#f0f0f0",
                  color: canAfford ? "white" : "#8e8e8e",
                  border: "none", borderRadius: "10px", padding: "8px 16px",
                  fontSize: "13px", fontWeight: "600",
                  cursor: canAfford ? "pointer" : "default",
                  fontFamily: "Inter, sans-serif", flexShrink: 0
                }}>
                  {canAfford ? "Unlock" : `Need ${cost - credits} more`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="section-label">How to Earn</p>
      <div style={{ margin: "0 16px", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "16px" }}>
        {HOW_TO_EARN.map((item, i) => (
          <div key={item.label}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px" }}>
              <span style={{ fontSize: "24px" }}>{item.icon}</span>
              <p style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: "14px", margin: 0 }}>{item.label}</p>
              <span style={{ fontWeight: "700", fontSize: "15px", fontFamily: "Inter, sans-serif" }}>+{item.coins} 🪙</span>
            </div>
            {i < HOW_TO_EARN.length - 1 && <div className="divider" />}
          </div>
        ))}
      </div>

      {/*double check this, no confidence..*/}
      {history.length > 0 && (
        <>
          <p className="section-label">Recent Activity</p>
          <div style={{ margin: "0 16px", borderRadius: "14px", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "20px" }}>
            {history.map((h, i) => (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
                  <span style={{ fontSize: "16px" }}>{h.amount > 0 ? "🪙" : "🔓"}</span>
                  <p style={{ flex: 1, fontSize: "13px", fontFamily: "Inter, sans-serif", margin: 0 }}>
                    {h.reason.replace(/_/g, " ")}
                  </p>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: h.amount > 0 ? "#15803d" : "#dc2626", fontFamily: "Inter, sans-serif" }}>
                    {h.amount > 0 ? "+" : ""}{h.amount} 🪙
                  </span>
                </div>
                {i < history.length - 1 && <div className="divider" />}
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ padding: "0 16px" }}>
        <button onClick={() => navigate("/groups")} className="btn-primary" style={{ fontSize: "15px" }}>
          Play games to earn coins
        </button>
      </div>
    </div>
  );
}
