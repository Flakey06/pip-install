import ThemePicker from "../components/ThemePicker";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function Home() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const [showTheme, setShowTheme] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    fetchProfile();
  }, []);

  const groupIds = profile?.groups || [];
  const { totalUnread } = useUnreadMessages(groupIds);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!profile)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid var(--purple-light)",
            borderTopColor: "var(--purple)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  const NAV_ITEMS = [
    { icon: "💬", label: "My Groups", path: "/groups", badge: totalUnread },
    { icon: "🔍", label: "Explore", path: "/explore" },
    { icon: "👥", label: "Friends", path: "/friends" },
  ];

  return (
    <>
      <div className="mesh-bg" />
      <div className="page-container">
        <div className="page-inner">
          {/* Profile header */}
          <div
            className="fade-up"
            style={{ textAlign: "center", marginBottom: "28px" }}
          >
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: "-3px",
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--purple), var(--pink))",
                  zIndex: 0,
                }}
              />
              <img
                src={profile.photoURL || auth.currentUser?.photoURL}
                alt="profile"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  position: "relative",
                  zIndex: 1,
                  border: "3px solid white",
                }}
              />
            </div>

            <h2
              style={{
                fontFamily: "'Comic Sans MS', sans-serif",
                fontSize: "26px",
                fontWeight: "800",
                color: "var(--text)",
                marginBottom: "4px",
              }}
            >
              Hey, {profile.username}!
            </h2>

            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              {profile.email}
            </p>
          </div>

          {/* Info card */}
          <div className="card fade-up-1" style={{ marginBottom: "16px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}
            >
              <div>
                <p className="section-label">Major</p>
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "var(--text)",
                  }}
                >
                  {profile.major}
                </p>
              </div>

              <div>
                <p className="section-label">Year</p>
                <p
                  style={{
                    fontWeight: "600",
                    fontSize: "14px",
                    color: "var(--text)",
                  }}
                >
                  Year {profile.year}
                </p>
              </div>

              {profile.telegram && (
                <div>
                  <p className="section-label">Telegram</p>
                  <p
                    style={{
                      fontWeight: "600",
                      fontSize: "14px",
                      color: "var(--purple)",
                    }}
                  >
                    {profile.telegram}
                  </p>
                </div>
              )}

              {profile.bio && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p className="section-label">Bio</p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      lineHeight: "1.5",
                    }}
                  >
                    {profile.bio}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          <div className="fade-up-2" style={{ marginBottom: "28px" }}>
            <p className="section-label">Interests</p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {profile.interests?.map((interest, i) => (
                <span
                  key={interest}
                  className="tag"
                  style={{
                    animation: `fadeUp 0.4s ${i * 0.05}s ease both`,
                  }}
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          <div
            className="fade-up-3"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            {NAV_ITEMS.map((item, i) => (
              <button
                key={item.path}
                className="btn-primary"
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  animation: `fadeUp 0.5s ${0.3 + i * 0.08}s ease both`,
                }}
              >
                {item.icon} {item.label}

                {item.badge > 0 && (
                  <span
                    style={{
                      background: "#EF4444",
                      color: "white",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "800",
                      padding: "2px 8px",
                      animation: "pulse 2s infinite",
                    }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Secondary buttons */}
          <div
            className="fade-up-4"
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Theme Picker */}
            <button
              onClick={() => setShowTheme(true)}
              className="btn-secondary"
              style={{ marginBottom: "10px" }}
            >
              🎨 Change Theme
            </button>

            {showTheme && (
              <ThemePicker onClose={() => setShowTheme(false)} />
            )}

            {/* Edit Profile */}
            <button
              className="btn-secondary"
              onClick={() => navigate("/edit-profile")}
            >
              ✏️ Edit Profile
            </button>

            {/* Logout */}
            <button className="btn-danger" onClick={logout}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}