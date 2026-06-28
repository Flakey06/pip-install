// fileuse: for first time setup, includes avatar, username, major, interests
import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useInterests } from "../hooks/useInterests";
import InterestSelector from "../components/InterestSelector";
import AvatarPicker from "../components/AvatarPicker";

export default function CreateProfile() {
  const [username, setUsername] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interests, setInterests] = useState([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(auth.currentUser?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const { allInterests, addToMaster } = useInterests();
  const navigate = useNavigate();


  const handleSubmit = async () => {
    if (!username || !major || !year) {
      alert("Please fill in all required fields!");
      return;
    }
    setSaving(true);
    const user = auth.currentUser;

    const finalAvatar = avatarUrl ||
      user.photoURL ||
      `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username)}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      photoURL: finalAvatar,
      username, major, year, bio, telegram, interests,
      groups: [],
      createdAt: new Date()
    });
    navigate("/home");
  };




  return (
    <>
      <div className="mesh-bg" />
      <div className="page-container">
        <div className="page-inner">

          <div className="fade-up" style={{ marginBottom: "32px" }}>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontSize: "28px",
              fontWeight: "800", color: "var(--text)", marginBottom: "6px"
            }}>
              Create Profile
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Tell us about yourself to find your people
            </p>
          </div>

          <div className="fade-up-1" style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div style={{
                position: "absolute", inset: "-3px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--purple), var(--pink))", zIndex: 0
              }} />
              <img
                src={avatarUrl || auth.currentUser?.photoURL}
                alt="avatar"
                style={{
                  width: "90px", height: "90px", borderRadius: "50%",
                  objectFit: "cover", position: "relative", zIndex: 1,
                  border: "3px solid white", cursor: "pointer"
                }}
                onClick={() => setShowAvatarPicker(true)}
              />
              <button onClick={() => setShowAvatarPicker(true)} style={{
                position: "absolute", bottom: "2px", right: "2px", zIndex: 2,
                width: "26px", height: "26px", borderRadius: "50%",
                background: "linear-gradient(135deg, var(--purple), var(--purple-dark))",
                color: "var(--bg)", border: "2px solid white",
                cursor: "pointer", fontSize: "13px",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>+</button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
              Tap to set avatar
            </p>
          </div>

          {showAvatarPicker && (
            <AvatarPicker
              currentPhoto={avatarUrl}
              onSave={(url) => { setAvatarUrl(url); setShowAvatarPicker(false); }}
              onClose={() => setShowAvatarPicker(false)}
            />
          )}

          <div className="fade-up-2" style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
            {[
              { label: "Username *", value: username, set: setUsername, placeholder: "e.g. jamie123", type: "input" },
              { label: "Major *", value: major, set: setMajor, placeholder: "e.g. Computer Science", type: "input" },
            ].map(field => (
              <div key={field.label}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>
                  {field.label}
                </label>
                <input
                  className="input-field"
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  placeholder={field.placeholder}
                />
              </div>
            ))}

            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>
                Year of Study *
              </label>
              <select className="input-field" value={year} onChange={e => setYear(e.target.value)}>
                <option value="">Select year</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
                <option value="grad">Graduate</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>
                Telegram Handle
              </label>
              <input className="input-field" value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" />
            </div>

            <div>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>
                Bio
              </label>
              <textarea
                className="input-field"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                style={{ height: "90px", resize: "none" }}
              />
            </div>
          </div>

          <div className="fade-up-3">
            <InterestSelector
              interests={interests}
              setInterests={setInterests}
              allInterests={allInterests}
              addToMaster={addToMaster}
            />
          </div>

          <div className="fade-up-4">
            <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ fontSize: "16px", padding: "16px" }}>
              {saving ? "Saving..." : "Save Profile 🚀"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
