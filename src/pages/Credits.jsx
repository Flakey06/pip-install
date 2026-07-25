// code use: pip coins — balance, unlock group slots, shop for cosmetics
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { spendCredits, UNLOCK_COSTS } from "../hooks/useCredits";

export default function Credits() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [activeTab, setActiveTab] = useState("slots");
  const navigate = useNavigate();

  const fetchProfile = async () => {
    const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
    if (snap.exists()) setProfile(snap.data());
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePurchase = async (item, cost) => {
    const result = await spendCredits(cost, item);
    if (result.success) {
      showMsg(`✅ Purchased! Check your profile.`);
      await fetchProfile();
    } else if (result.reason === "not_enough") {
      showMsg(`❌ Need ${cost} 🪙 — play games to earn more!`);
    } else if (result.reason === "already_unlocked" || result.reason === "already_owned") {
      showMsg(`✅ Already unlocked!`);
    }
  };

  const handleUsernameChange = async () => {
    if (!newUsername.trim() || newUsername.trim().length < 3) {
      showMsg("❌ Username must be at least 3 characters!"); return;
    }
    const result = await spendCredits(UNLOCK_COSTS.change_username, "change_username_" + Date.now());
    if (result.success) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), { username: newUsername.trim() });
      showMsg("✅ Username changed!");
      setShowUsernameInput(false);
      setNewUsername("");
      await fetchProfile();
    } else if (result.reason === "not_enough") {
      showMsg(`❌ Need ${UNLOCK_COSTS.change_username} 🪙!`);
    }
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <div className="loader" />
    </div>
  );

  const credits = profile?.credits || 0;
  const maxGroups = profile?.maxGroups || 5;
  const purchases = profile?.purchases || [];
  const currentRing = profile?.profileRing || null;
  const currentBadge = profile?.profileBadge || null;

  const SLOTS = [
    { id: "slot_6", cost: UNLOCK_COSTS.slot_6, label: "6th Group Slot", desc: "Join one more group" },
    { id: "slot_7", cost: UNLOCK_COSTS.slot_7, label: "7th Group Slot", desc: "For the social butterfly" },
    { id: "slot_8", cost: UNLOCK_COSTS.slot_8, label: "8th Group Slot", desc: "Maximum connections" },
  ];

  const RINGS = [
    { id: "premium_ring", cost: UNLOCK_COSTS.premium_ring, label: "Purple Ring", desc: "Solid purple profile border", preview: "linear-gradient(135deg, var(--purple), var(--purple-dark))" },
    { id: "gold_ring", cost: UNLOCK_COSTS.gold_ring, label: "Gold Ring", desc: "Shiny gold profile border", preview: "linear-gradient(135deg, #f7c94b, #e6a817)" },
    { id: "rainbow_ring", cost: UNLOCK_COSTS.rainbow_ring, label: "Rainbow Ring ✨", desc: "Animated rainbow border", preview: "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)" },
  ];

  const BADGES = [
    { id: "badge_star", cost: UNLOCK_COSTS.badge_star, label: "⭐ Star", desc: "Show you're a star member" },
    { id: "badge_fire", cost: UNLOCK_COSTS.badge_fire, label: "🔥 Fire", desc: "Show you're on fire" },
    { id: "badge_crown", cost: UNLOCK_COSTS.badge_crown, label: "👑 Crown", desc: "Show you're royalty" },
  ];

  const HOW_TO_EARN = [
    { icon: "☀️", label: "Daily login", coins: 5 },
    { icon: "🗳️", label: "Vote in Would You Rather", coins: 2 },
    { icon: "👆", label: "Vote in Most Likely To", coins: 2 },
    { icon: "🧠", label: "Play Trivia", coins: 3 },
    { icon: "✅", label: "Correct Trivia / Two Truths", coins: 10 },
    { icon: "✏️", label: "First to solve Quick Draw", coins: 10 },
  ];

  const tabStyle = (tab) => ({
    background: "none", border: "none", padding: "10px 16px 10px 0",
    fontSize: "14px", fontWeight: activeTab === tab ? "700" : "400",
    color: activeTab === tab ? "var(--text)" : "var(--text-muted)",
    borderBottom: activeTab === tab ? "2px solid var(--text)" : "2px solid transparent",
    cursor: "pointer", fontFamily: "Inter, sans-serif", marginBottom: "-1px"
  });

  const itemCardStyle = (owned) => ({
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 16px", borderRadius: "14px",
    border: owned ? "1px solid #bbf7d0" : `1px solid var(--border)`,
    background: owned ? "#f0fdf4" : "var(--card)"
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "40px" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">pip coins 🪙</span>
        <div style={{ width: "20px" }} />
      </div>

      {/* Balance card */}
      <div style={{ margin: "16px", padding: "24px 20px", background: "var(--purple-dark)", borderRadius: "20px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", margin: "0 0 6px", fontFamily: "Inter, sans-serif", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase" }}>Your Balance</p>
        <p style={{ fontSize: "52px", fontWeight: "800", margin: "0 0 4px", fontFamily: "Inter, sans-serif", color: "var(--bg)" }}>{credits}</p>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: "0 0 16px", fontFamily: "Inter, sans-serif" }}>pip coins 🪙</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Group limit: <strong style={{ color: "var(--bg)" }}>{maxGroups}</strong>
            </p>
          </div>
          {currentRing && (
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                Ring: <strong style={{ color: "var(--bg)" }}>{currentRing.replace("_ring", "")}</strong>
              </p>
            </div>
          )}
          {currentBadge && (
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px" }}>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                Badge: {currentBadge === "badge_star" ? "⭐" : currentBadge === "badge_fire" ? "🔥" : "👑"}
              </p>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div style={{
          margin: "0 16px 14px", padding: "12px 14px", borderRadius: "10px",
          background: message.startsWith("✅") ? "#f0fdf4" : "#fff5f5",
          border: `1px solid ${message.startsWith("✅") ? "#bbf7d0" : "#fecaca"}`,
          color: message.startsWith("✅") ? "#15803d" : "#dc2626",
          fontSize: "14px", fontFamily: "Inter, sans-serif", fontWeight: "600"
        }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid var(--border)`, padding: "0 16px", marginBottom: "4px" }}>
        {[["slots", "Group Slots"], ["rings", "Profile Rings"], ["badges", "Badges"], ["other", "Other"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)} style={tabStyle(key)}>{label}</button>
        ))}
      </div>

      {/* ── SLOTS ── */}
      {activeTab === "slots" && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          {SLOTS.map(({ id, cost, label, desc }) => {
            const slot = parseInt(id.split("_")[1]);
            const unlocked = maxGroups >= slot;
            const canAfford = credits >= cost;
            return (
              <div key={id} style={itemCardStyle(unlocked)}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: unlocked ? "#dcfce7" : "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>
                  {unlocked ? "✅" : "🔒"}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>{label}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>{unlocked ? "Unlocked ✓" : `${cost} 🪙 · ${desc}`}</p>
                </div>
                {!unlocked && (
                  <button onClick={() => handlePurchase(id, cost)} disabled={!canAfford} style={{
                    background: canAfford ? "var(--purple-dark)" : "var(--input-bg)",
                    color: canAfford ? "var(--bg)" : "var(--text-muted)",
                    border: "none", borderRadius: "10px", padding: "8px 14px",
                    fontSize: "13px", fontWeight: "600", cursor: canAfford ? "pointer" : "default",
                    fontFamily: "Inter, sans-serif", flexShrink: 0
                  }}>
                    {canAfford ? "Unlock" : `Need ${cost - credits} more`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── RINGS ── */}
      {activeTab === "rings" && (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
            Premium rings show around your profile picture everywhere in the app.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {RINGS.map(({ id, cost, label, desc, preview }) => {
              const owned = purchases.includes(id);
              const active = currentRing === id;
              const canAfford = credits >= cost;
              return (
                <div key={id} style={itemCardStyle(owned)}>
                  {/* Ring preview */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: preview, padding: "3px" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--card)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                        👤
                      </div>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>
                      {label} {active ? "· Active" : ""}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                      {owned ? "Owned ✓" : `${cost} 🪙`} · {desc}
                    </p>
                  </div>
                  {!owned ? (
                    <button onClick={() => handlePurchase(id, cost)} disabled={!canAfford} style={{
                      background: canAfford ? "var(--purple-dark)" : "var(--input-bg)",
                      color: canAfford ? "var(--bg)" : "var(--text-muted)",
                      border: "none", borderRadius: "10px", padding: "8px 14px",
                      fontSize: "13px", fontWeight: "600", cursor: canAfford ? "pointer" : "default",
                      fontFamily: "Inter, sans-serif", flexShrink: 0
                    }}>
                      {canAfford ? "Buy" : `Need ${cost - credits} more`}
                    </button>
                  ) : !active ? (
                    <button onClick={async () => {
                      await updateDoc(doc(db, "users", auth.currentUser.uid), { profileRing: id });
                      await fetchProfile();
                      showMsg("✅ Ring activated!");
                    }} style={{
                      background: "var(--purple-dark)", color: "var(--bg)",
                      border: "none", borderRadius: "10px", padding: "8px 14px",
                      fontSize: "13px", fontWeight: "600", cursor: "pointer",
                      fontFamily: "Inter, sans-serif", flexShrink: 0
                    }}>
                      Equip
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BADGES ── */}
      {activeTab === "badges" && (
        <div style={{ padding: "12px 16px" }}>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
            Badges show next to your name in group chats and on your profile.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {BADGES.map(({ id, cost, label, desc }) => {
              const owned = purchases.includes(id);
              const active = currentBadge === id;
              const canAfford = credits >= cost;
              return (
                <div key={id} style={itemCardStyle(owned)}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--purple-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
                    {label.split(" ")[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>
                      {label} {active ? "· Active" : ""}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                      {owned ? "Owned ✓" : `${cost} 🪙`} · {desc}
                    </p>
                  </div>
                  {!owned ? (
                    <button onClick={() => handlePurchase(id, cost)} disabled={!canAfford} style={{
                      background: canAfford ? "var(--purple-dark)" : "var(--input-bg)",
                      color: canAfford ? "var(--bg)" : "var(--text-muted)",
                      border: "none", borderRadius: "10px", padding: "8px 14px",
                      fontSize: "13px", fontWeight: "600", cursor: canAfford ? "pointer" : "default",
                      fontFamily: "Inter, sans-serif", flexShrink: 0
                    }}>
                      {canAfford ? "Buy" : `Need ${cost - credits} more`}
                    </button>
                  ) : !active ? (
                    <button onClick={async () => {
                      await updateDoc(doc(db, "users", auth.currentUser.uid), { profileBadge: id });
                      await fetchProfile();
                      showMsg("✅ Badge equipped!");
                    }} style={{
                      background: "var(--purple-dark)", color: "var(--bg)",
                      border: "none", borderRadius: "10px", padding: "8px 14px",
                      fontSize: "13px", fontWeight: "600", cursor: "pointer",
                      fontFamily: "Inter, sans-serif", flexShrink: 0
                    }}>
                      Equip
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── OTHER ── */}
      {activeTab === "other" && (
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Change username */}
          <div style={{ padding: "16px", borderRadius: "14px", border: `1px solid var(--border)`, background: "var(--card)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: showUsernameInput ? "14px" : "0" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--purple-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>✏️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>Change Username</p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>{UNLOCK_COSTS.change_username} 🪙 · Update your display name</p>
              </div>
              <button onClick={() => setShowUsernameInput(!showUsernameInput)} style={{
                background: credits >= UNLOCK_COSTS.change_username ? "var(--purple-dark)" : "var(--input-bg)",
                color: credits >= UNLOCK_COSTS.change_username ? "var(--bg)" : "var(--text-muted)",
                border: "none", borderRadius: "10px", padding: "8px 14px",
                fontSize: "13px", fontWeight: "600", cursor: credits >= UNLOCK_COSTS.change_username ? "pointer" : "default",
                fontFamily: "Inter, sans-serif", flexShrink: 0
              }}>
                {showUsernameInput ? "Cancel" : "Change"}
              </button>
            </div>
            {showUsernameInput && (
              <div>
                <label className="input-label">New username</label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <input className="input-underline" value={newUsername} onChange={e => setNewUsername(e.target.value)}
                    placeholder={`Current: ${profile?.username}`} style={{ flex: 1 }} />
                  <button onClick={handleUsernameChange} style={{
                    background: "var(--purple-dark)", color: "var(--bg)", border: "none",
                    borderRadius: "8px", padding: "8px 14px", fontSize: "13px",
                    fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif", flexShrink: 0
                  }}>Save</button>
                </div>
              </div>
            )}
          </div>

          {/* How to earn */}
          <div>
            <p className="section-label" style={{ padding: "0 0 8px" }}>How to Earn Coins</p>
            <div style={{ borderRadius: "14px", border: `1px solid var(--border)`, overflow: "hidden", background: "var(--card)" }}>
              {HOW_TO_EARN.map((item, i) => (
                <div key={item.label}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px" }}>
                    <span style={{ fontSize: "22px" }}>{item.icon}</span>
                    <p style={{ flex: 1, fontFamily: "Inter, sans-serif", fontSize: "14px", margin: 0, color: "var(--text)" }}>{item.label}</p>
                    <span style={{ fontWeight: "700", fontSize: "14px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>+{item.coins} 🪙</span>
                  </div>
                  {i < HOW_TO_EARN.length - 1 && <div className="divider" />}
                </div>
              ))}
            </div>
          </div>

          {/* Recent history */}
          {(profile?.creditHistory?.length || 0) > 0 && (
            <div>
              <p className="section-label" style={{ padding: "0 0 8px" }}>Recent Activity</p>
              <div style={{ borderRadius: "14px", border: `1px solid var(--border)`, overflow: "hidden", background: "var(--card)" }}>
                {[...(profile?.creditHistory || [])].reverse().slice(0, 6).map((h, i, arr) => (
                  <div key={i}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
                      <span style={{ fontSize: "16px" }}>{h.amount > 0 ? "🪙" : "🛒"}</span>
                      <p style={{ flex: 1, fontSize: "13px", fontFamily: "Inter, sans-serif", margin: 0, color: "var(--text)" }}>
                        {h.reason.replace(/_/g, " ")}
                      </p>
                      <span style={{ fontSize: "14px", fontWeight: "700", color: h.amount > 0 ? "#15803d" : "#dc2626", fontFamily: "Inter, sans-serif" }}>
                        {h.amount > 0 ? "+" : ""}{h.amount} 🪙
                      </span>
                    </div>
                    {i < arr.length - 1 && <div className="divider" />}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
