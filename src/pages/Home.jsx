 // code use: profile dashboard, got stats, coins, interests, nav buttons
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import { getCredits, awardCredits } from "../hooks/useCredits";
import TabBar from "../components/TabBar";
import ThemePicker from "../components/ThemePicker";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [credits, setCredits] = useState(0);
  const [showTheme, setShowTheme] = useState(false);
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
    };
    fetch();
  }, []);

  const { totalUnread } = useUnreadMessages(profile?.groups || []);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!profile) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  return (
    <div className="page">
      {/* header */}
      <div className="header">
        <span className="header-title">{profile.username}</span>
        <button onClick={logout} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* profile section */}
      <div style={{ padding: "20px 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "16px" }}>
          {/* avatar */}
          <img
            src={profile.photoURL || auth.currentUser?.photoURL}
            alt="avatar"
            className="avatar"
            style={{ width: "80px", height: "80px", flexShrink: 0 }}
          />

          <div style={{ display: "flex", gap: "20px", flex: 1, justifyContent: "space-around" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", margin: 0 }}>
                {profile.groups?.length || 0}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Groups</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", margin: 0 }}>
                {profile.interests?.length || 0}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Interests</p>
            </div>
            {/* coins tokens */}
            <div
              style={{ textAlign: "center", cursor: "pointer" }}
              onClick={() => navigate("/credits")}
            >
              <p style={{ fontSize: "18px", fontWeight: "700", color: "var(--text)", margin: 0 }}>
                {credits}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>🪙 Coins</p>
            </div>
          </div>
        </div>


        <div style={{ marginBottom: "14px" }}>
          <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 2px" }}>{profile.username}</p>
          {profile.major && <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 2px" }}>{profile.major} · Year {profile.year}</p>}
          {profile.bio && <p style={{ fontSize: "14px", margin: "0 0 2px", lineHeight: "1.4" }}>{profile.bio}</p>}
          {profile.telegram && (
            <p style={{ fontSize: "14px", color: "var(--purple-dark)", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              {profile.telegram}
            </p>
          )}
        </div>


        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button className="btn-secondary" onClick={() => navigate("/edit-profile")} style={{ fontSize: "14px", padding: "8px" }}>
            Edit profile
          </button>
          <button className="btn-secondary" onClick={() => setShowTheme(true)} style={{ fontSize: "14px", padding: "8px", width: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
            🎨
          </button>
          <button className="btn-secondary" onClick={() => navigate("/calendar")} style={{ fontSize: "14px", padding: "8px", width: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
            📅
          </button>
          <button className="btn-secondary" onClick={() => navigate("/credits")} style={{ fontSize: "14px", padding: "8px", width: "auto", paddingLeft: "16px", paddingRight: "16px" }}>
            🪙
          </button>
        </div>
      </div>

      <div className="divider" style={{ margin: 0 }} />


      {profile.interests?.length > 0 && (
        <>
          <p className="section-label">Interests</p>
          <div style={{ padding: "0 16px 20px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {profile.interests.map(i => (
              <span key={i} className="tag">{i}</span>
            ))}
          </div>
        </>
      )}

      <TabBar unread={totalUnread} />
      {showTheme && <ThemePicker onClose={() => setShowTheme(false)} />}
    </div>
  );
}
