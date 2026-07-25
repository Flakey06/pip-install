// code use: profile dashboard, got stats, coins, interests, nav buttons
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import { getCredits, awardCredits } from "../hooks/useCredits";
import { getViewerProfiles } from "../hooks/useProfileViews";
import TabBar from "../components/TabBar";
import ThemePicker from "../components/ThemePicker";
import MemberProfile from "../components/MemberProfile";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [credits, setCredits] = useState(0);
  const [viewers, setViewers] = useState([]);
  const [showTheme, setShowTheme] = useState(false);
  const [selectedViewer, setSelectedViewer] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfile(snap.data());
      const c = await getCredits();
      setCredits(c);
      await awardCredits("daily_login");
      const v = await getViewerProfiles(user.uid);
      setViewers(v);
    };
    fetch();
  }, []);

  const { totalUnread } = useUnreadMessages(profile?.groups || []);
  const logout = async () => { await signOut(auth); navigate("/"); };

  if (!profile) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
      <div className="loader" />
    </div>
  );

  const ringStyle = profile.profileRing === "rainbow_ring"
    ? "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)"
    : profile.profileRing === "gold_ring"
    ? "linear-gradient(135deg, #f7c94b, #e6a817)"
    : profile.profileRing === "premium_ring"
    ? "linear-gradient(135deg, var(--purple), var(--purple-dark))"
    : null;

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <span className="header-title">{profile.username}</span>
        <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <div style={{ padding: "20px 16px 16px" }}>
        {/* Avatar + stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
          {/* Avatar with ring */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            {ringStyle && (
              <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", background: ringStyle, zIndex: 0 }} />
            )}
            <img
              src={profile.photoURL || auth.currentUser?.photoURL}
              alt="avatar"
              className="avatar"
              style={{
                width: "80px", height: "80px", position: "relative", zIndex: 1,
                border: ringStyle ? "3px solid var(--bg)" : `2px solid var(--border)`
              }}
            />
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: "20px", flex: 1, justifyContent: "space-around" }}>
            {[
              { val: profile.groups?.length || 0, label: "Groups" },
              { val: profile.interests?.length || 0, label: "Interests" },
              { val: credits, label: "🪙 Coins", onClick: () => navigate("/credits") },
            ].map(item => (
              <div key={item.label} style={{ textAlign: "center", cursor: item.onClick ? "pointer" : "default" }} onClick={item.onClick}>
                <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", margin: 0 }}>{item.val}</p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Name + badge + bio */}
        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px", color: "var(--text)", fontFamily: "Inter, sans-serif", display: "flex", alignItems: "center", gap: "6px" }}>
            {profile.username}
            {profile.nusVerified && (
              <span style={{
                fontSize: "12px", background: "#1d4ed8", color: "white",
                padding: "2px 8px", borderRadius: "6px",
                fontFamily: "Inter, sans-serif", fontWeight: "700"
              }}>✅ NUS</span>
            )}
            {profile.profileBadge && (
              <span style={{ fontSize: "16px" }}>
                {profile.profileBadge === "badge_star" ? "⭐" : profile.profileBadge === "badge_fire" ? "🔥" : "👑"}
              </span>
            )}
          </p>
          {profile.major && <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>{profile.major} · Year {profile.year}</p>}
          {profile.bio && <p style={{ fontSize: "14px", margin: "0 0 2px", lineHeight: "1.4", color: "var(--text)", fontFamily: "Inter, sans-serif" }}>{profile.bio}</p>}
          {profile.telegram && (
            <p style={{ fontSize: "14px", color: "var(--purple-dark)", margin: 0, display: "flex", alignItems: "center", gap: "4px", fontFamily: "Inter, sans-serif" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              {profile.telegram}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { label: "Edit profile", action: () => navigate("/edit-profile") },
            { label: "🎨", action: () => setShowTheme(true), small: true },
            { label: "📅", action: () => navigate("/calendar"), small: true },
            { label: "🪙", action: () => navigate("/credits"), small: true },
            { label: "🎓", action: () => navigate("/nus-verify"), small: true },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action} className="btn-secondary" style={{
              fontSize: "14px", padding: "8px",
              width: btn.small ? "auto" : undefined,
              paddingLeft: btn.small ? "16px" : undefined,
              paddingRight: btn.small ? "16px" : undefined,
            }}>
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider" style={{ margin: 0 }} />

      {/* Interests */}
      {profile.interests?.length > 0 && (
        <>
          <p className="section-label">Interests</p>
          <div style={{ padding: "0 16px 20px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {profile.interests.map(i => (
              <span key={i} style={{
                padding: "5px 14px", borderRadius: "20px",
                background: "var(--purple-light)", color: "var(--purple-dark)",
                fontSize: "13px", fontWeight: "600", border: `1px solid var(--border)`,
                fontFamily: "Inter, sans-serif"
              }}>{i}</span>
            ))}
          </div>
        </>
      )}

      {/* Profile viewers */}
      {viewers.length > 0 && (
        <>
          <div className="divider" style={{ margin: 0 }} />
          <p className="section-label">👀 Who viewed your profile ({viewers.length})</p>
          <div style={{ padding: "0 16px 20px", display: "flex", gap: "14px", overflowX: "auto" }}>
            {viewers.map(v => (
              <div key={v.uid} style={{ textAlign: "center", flexShrink: 0, cursor: "pointer" }}
                onClick={() => setSelectedViewer(v.uid)}>
                <div style={{ position: "relative" }}>
                  {v.profileRing && (
                    <div style={{
                      position: "absolute", inset: "-2px", borderRadius: "50%",
                      background: v.profileRing === "rainbow_ring"
                        ? "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)"
                        : v.profileRing === "gold_ring"
                        ? "linear-gradient(135deg, #f7c94b, #e6a817)"
                        : "linear-gradient(135deg, var(--purple), var(--purple-dark))"
                    }} />
                  )}
                  <img src={v.photoURL} alt={v.username} className="avatar"
                    style={{ width: "48px", height: "48px", position: "relative", border: v.profileRing ? "2px solid var(--bg)" : `1px solid var(--border)` }} />
                </div>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0", fontFamily: "Inter, sans-serif", maxWidth: "52px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {v.username}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      <TabBar unread={totalUnread} />
      {showTheme && <ThemePicker onClose={() => setShowTheme(false)} />}
      {selectedViewer && <MemberProfile uid={selectedViewer} onClose={() => setSelectedViewer(null)} />}
    </div>
  );
}
