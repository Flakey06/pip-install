import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useInterests } from "../hooks/useInterests";
import InterestSelector from "../components/InterestSelector";
import AvatarPicker from "../components/AvatarPicker";

function EditProfile() {
  const [username, setUsername] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interests, setInterests] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const { allInterests, addToMaster } = useInterests();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username);
        setMajor(data.major);
        setYear(data.year);
        setBio(data.bio || "");
        setTelegram(data.telegram || "");
        setInterests(data.interests || []);
        setAvatarUrl(data.photoURL || "");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!username || !major || !year) {
      alert("Please fill in all required fields!");
      return;
    }
    const user = auth.currentUser;
    await updateDoc(doc(db, "users", user.uid), {
      photoURL: avatarUrl,
      username, major, year, bio, telegram, interests,
      updatedAt: new Date()
    });
    navigate("/home");
  };

  const inputStyle = {
    width: "100%", padding: "12px", marginTop: "6px",
    borderRadius: "10px", border: "1.5px solid #e0e0e0",
    fontSize: "15px", color: "#1a1a1a", background: "white",
    outline: "none", boxSizing: "border-box"
  };
  const labelStyle = { color: "#1a1a1a", fontSize: "14px", fontWeight: "bold" };

  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", paddingTop: "60px", paddingBottom: "60px" }}>

        <h2 style={{ color: "#1a1a1a", fontSize: "26px", marginBottom: "20px", textAlign: "center" }}>
          Edit Profile ✏️
        </h2>

        {/* Avatar picker */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <img
              src={avatarUrl || auth.currentUser?.photoURL}
              alt="avatar"
              style={{
                width: "90px", height: "90px", borderRadius: "50%",
                border: "3px solid #4F46E5", objectFit: "cover"
              }}
            />
            <button
              onClick={() => setShowAvatarPicker(true)}
              style={{
                position: "absolute", bottom: 0, right: 0,
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#4F46E5", color: "white",
                border: "2px solid white", cursor: "pointer",
                fontSize: "14px", display: "flex",
                alignItems: "center", justifyContent: "center"
              }}
            >
              ✏️
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#888", marginTop: "8px" }}>
            Tap to change avatar
          </p>
        </div>

        {showAvatarPicker && (
          <AvatarPicker
            currentPhoto={avatarUrl}
            onSave={(url) => { setAvatarUrl(url); setShowAvatarPicker(false); }}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Username *</label>
          <input value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Major *</label>
          <input value={major} onChange={e => setMajor(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Year of Study *</label>
          <select value={year} onChange={e => setYear(e.target.value)} style={inputStyle}>
            <option value="">Select year</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="grad">Graduate</option>
          </select>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Telegram Handle</label>
          <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" style={inputStyle} />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Bio</label>
          <textarea value={bio} onChange={e => setBio(e.target.value)}
            style={{ ...inputStyle, height: "90px", resize: "none" }} />
        </div>

        <InterestSelector
          interests={interests}
          setInterests={setInterests}
          allInterests={allInterests}
          addToMaster={addToMaster}
        />

        <button onClick={handleSave} style={{
          width: "100%", padding: "14px", background: "#4F46E5",
          color: "white", border: "none", borderRadius: "12px",
          cursor: "pointer", fontSize: "16px", fontWeight: "bold",
          marginBottom: "12px", boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
        }}>
          Save Changes ✅
        </button>

        <button onClick={() => navigate("/home")} style={{
          width: "100%", padding: "14px", background: "white",
          color: "#4F46E5", border: "2px solid #4F46E5", borderRadius: "12px",
          cursor: "pointer", fontSize: "16px", fontWeight: "bold"
        }}>
          Cancel
        </button>

      </div>
    </div>
  );
}

export default EditProfile;