import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useInterests } from "../hooks/useInterests";
import AvatarPicker from "../components/AvatarPicker";

export default function EditProfile() {
  const [username, setUsername] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interestText, setInterestText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setUsername(d.username || "");
        setMajor(d.major || "");
        setYear(d.year || "");
        setBio(d.bio || "");
        setTelegram(d.telegram || "");
        setInterestText((d.interests || []).join(", "));
        setAvatarUrl(d.photoURL || "");
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!username) { alert("Username required!"); return; }
    setSaving(true);
    const interests = interestText.split(",").map(s => s.toLowerCase().trim()).filter(Boolean);
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      username, major, year, bio, telegram, interests,
      photoURL: avatarUrl, updatedAt: new Date()
    });
    navigate("/home");
  };

  const FIELDS = [
    { label: "Username", value: username, set: setUsername, placeholder: "Your username" },
    { label: "Bio", value: bio, set: setBio, placeholder: "Tell people about yourself" },
    { label: "Major", value: major, set: setMajor, placeholder: "e.g. Computer Science" },
    { label: "Telegram", value: telegram, set: setTelegram, placeholder: "@handle" },
    { label: "Interests (comma separated)", value: interestText, set: setInterestText, placeholder: "e.g. AI, basketball, music" },
  ];

  return (
    <div className="page" style={{ paddingBottom: 0 }}>
      {/* Header */}
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">Edit Profile</span>
        <button className="text-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Avatar */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 0 20px" }}>
        <img
          src={avatarUrl || auth.currentUser?.photoURL}
          alt="avatar"
          className="avatar"
          style={{ width: "90px", height: "90px", marginBottom: "10px", cursor: "pointer" }}
          onClick={() => setShowAvatarPicker(true)}
        />
        <button className="text-btn" onClick={() => setShowAvatarPicker(true)}>
          Change Photo
        </button>
      </div>

      <div className="divider" />

      {/* Form fields */}
      <div style={{ padding: "0 16px" }}>
        {FIELDS.map((field, i) => (
          <div key={field.label} style={{ padding: "14px 0", borderBottom: i < FIELDS.length - 1 ? "1px solid var(--border)" : "none" }}>
            <label className="input-label">{field.label}</label>
            <input
              className="input-underline"
              value={field.value}
              onChange={e => field.set(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        ))}

        {/* Year */}
        <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
          <label className="input-label">Year of Study</label>
          <select
            className="input-underline"
            value={year}
            onChange={e => setYear(e.target.value)}
            style={{ cursor: "pointer" }}
          >
            <option value="">Select</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
            <option value="grad">Graduate</option>
          </select>
        </div>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentPhoto={avatarUrl}
          onSave={url => { setAvatarUrl(url); setShowAvatarPicker(false); }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
