import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

function Home() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) setProfile(docSnap.data());
    };
    fetchProfile();
  }, []);

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  if (!profile) return (
    <div style={{ textAlign: "center", marginTop: "100px", color: "#4F46E5" }}>
      Loading... ⏳
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "white",
      display: "flex",
      justifyContent: "center",
      padding: "0 24px"
    }}>
      <div style={{ width: "100%", maxWidth: "420px", paddingTop: "60px", paddingBottom: "60px" }}>

        {/* Profile header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src={auth.currentUser?.photoURL}
            alt="profile"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              border: "3px solid #4F46E5",
              marginBottom: "12px"
            }}
          />
          <h2 style={{ color: "#1a1a1a", fontSize: "24px", marginBottom: "4px" }}>
            Hey, {profile.username}! 👋
          </h2>
          <p style={{ color: "#888", fontSize: "14px" }}>{profile.email}</p>
        </div>

        {/* Info card */}
        <div style={{
          background: "rgba(79, 70, 229, 0.06)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <p style={{ margin: "0 0 10px", color: "#1a1a1a" }}><strong>Major:</strong> {profile.major}</p>
          <p style={{ margin: "0 0 10px", color: "#1a1a1a" }}><strong>Year:</strong> Year {profile.year}</p>
          {profile.telegram && <p style={{ margin: "0 0 10px", color: "#1a1a1a" }}><strong>Telegram:</strong> {profile.telegram}</p>}
          {profile.bio && <p style={{ margin: 0, color: "#1a1a1a" }}><strong>Bio:</strong> {profile.bio}</p>}
        </div>

        {/* Interests */}
        <div style={{ marginBottom: "32px" }}>
          <p style={{ fontWeight: "bold", marginBottom: "10px", color: "#1a1a1a" }}>Interests</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {profile.interests.map(interest => (
              <span key={interest} style={{
                padding: "6px 14px",
                borderRadius: "20px",
                background: "#4F46E5",
                color: "white",
                fontSize: "13px",
                fontWeight: "bold"
              }}>
                {interest}
              </span>
            ))}
          </div>
        </div>

        {/* Buttons */}

        <button
          onClick={() => navigate("/chat/testgroup1")}
          style={{
            width: "100%",
            padding: "14px",
            background: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
          }}
        >
          💬 Go to Group Chat
        </button>

        <button
          onClick={() => navigate("/edit-profile")}
          style={{
            width: "100%",
            padding: "14px",
            background: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "12px",
            boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
          }}
        >
          Edit Profile ✏️
        </button>

        <button
          onClick={logout}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            color: "#4F46E5",
            border: "2px solid #4F46E5",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          Log Out
        </button>

      </div>
    </div>
  );
}

export default Home;