import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const INTERESTS = [
  "Hackathons", "Gaming", "Music", "Sports", "Art",
  "Entrepreneurship", "AI", "Design", "Photography", "Reading"
];

function CreateProfile() {
  const [username, setUsername] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interests, setInterests] = useState([]);
  const navigate = useNavigate();

  const toggleInterest = (interest) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (!username || !major || !year) {
      alert("Please fill in all required fields!");
      return;
    }

    const user = auth.currentUser;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      photoURL: user.photoURL,
      username,
      major,
      year,
      bio,
      telegram,
      interests,
      createdAt: new Date()
    });

    navigate("/home");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", padding: "20px" }}>
      <h2>Create Your Profile 👤</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Username *</label><br />
        <input
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="e.g. jamie123"
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Major *</label><br />
        <input
          value={major}
          onChange={e => setMajor(e.target.value)}
          placeholder="e.g. Computer Science"
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Year of Study *</label><br />
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        >
          <option value="">Select year</option>
          <option value="1">Year 1</option>
          <option value="2">Year 2</option>
          <option value="3">Year 3</option>
          <option value="4">Year 4</option>
          <option value="grad">Graduate</option>
        </select>
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Telegram Handle</label><br />
        <input
          value={telegram}
          onChange={e => setTelegram(e.target.value)}
          placeholder="e.g. @jamie"
          style={{ width: "100%", padding: "8px", marginTop: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Bio</label><br />
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          placeholder="Tell people about yourself..."
          style={{ width: "100%", padding: "8px", marginTop: "5px", height: "80px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Interests (pick as many as you like!)</label><br />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
          {INTERESTS.map(interest => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid #ccc",
                background: interests.includes(interest) ? "#4F46E5" : "white",
                color: interests.includes(interest) ? "white" : "black",
                cursor: "pointer"
              }}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        style={{
          width: "100%",
          padding: "12px",
          background: "#4F46E5",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "16px"
        }}
      >
        Save Profile 🚀
      </button>
    </div>
  );
}

export default CreateProfile;