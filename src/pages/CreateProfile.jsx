// file use: first time profile setup, slide-by-slide onboarding
import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useInterests } from "../hooks/useInterests";
import AvatarPicker from "../components/AvatarPicker";

const STEPS = 6;

export default function CreateProfile() {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [major, setMajor] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [telegram, setTelegram] = useState("");
  const [interests, setInterests] = useState([]);
  const [interestInput, setInterestInput] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(auth.currentUser?.photoURL || "");
  const [saving, setSaving] = useState(false);
  const { allInterests, addToMaster } = useInterests();
  const navigate = useNavigate();

  const defaultAvatar = `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${encodeURIComponent(username || auth.currentUser?.uid || "user")}`;

  const canNext = () => {
    if (step === 1 && !username.trim()) return false;
    if (step === 2 && (!major.trim() || !year)) return false;
    return true;
  };

  const handleNext = () => {
    if (!canNext()) return;
    if (step < STEPS - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const addInterest = (interest) => {
    const norm = interest.toLowerCase().trim();
    if (!norm || interests.includes(norm)) return;
    setInterests(p => [...p, norm]);
    addToMaster(norm);
    setInterestInput("");
  };

  const removeInterest = (i) => {
    setInterests(p => p.filter(x => x !== i));
  };

  const handleSubmit = async () => {
    if (!username || !major || !year) { alert("Please fill required fields!"); return; }
    setSaving(true);
    const user = auth.currentUser;
    const finalAvatar = avatarUrl || user.photoURL || defaultAvatar;
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid, email: user.email,
      photoURL: finalAvatar,
      username: username.trim(), major: major.trim(),
      year, bio: bio.trim(), telegram: telegram.trim(),
      interests, groups: [], createdAt: new Date()
    });
    navigate("/onboarding");
  };

  const filteredSuggestions = interestInput.trim()
    ? allInterests.filter(i =>
        i.toLowerCase().includes(interestInput.toLowerCase()) &&
        !interests.includes(i.toLowerCase())
      ).slice(0, 5)
    : [];

  const progress = ((step) / (STEPS - 1)) * 100;

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column"
    }}>
      {/* Progress bar */}
      <div style={{ height: "3px", background: "var(--border)", width: "100%" }}>
        <div style={{
          height: "100%", background: "var(--purple-dark)",
          width: `${progress}%`, transition: "width 0.4s ease"
        }} />
      </div>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center",
        padding: "14px 16px", gap: "12px"
      }}>
        {step > 0 && (
          <button onClick={handleBack} style={{
            background: "none", border: "none", cursor: "pointer",
            display: "flex", color: "var(--text)"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <p style={{
          fontSize: "13px", color: "var(--text-muted)",
          fontFamily: "Inter, sans-serif", margin: 0
        }}>
          {step + 1} of {STEPS}
        </p>
      </div>

      {/* Slide content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "20px 24px 40px", maxWidth: "420px",
        margin: "0 auto", width: "100%"
      }}>

        {/* ── SLIDE 0: Avatar ── */}
        {step === 0 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>📸</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              Add a profile photo
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px", fontFamily: "Inter, sans-serif" }}>
              Help people recognise you. You can always change this later.
            </p>

            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="avatar"
                  style={{
                    width: "120px", height: "120px", borderRadius: "50%",
                    objectFit: "cover", border: `3px solid var(--border)`,
                    cursor: "pointer"
                  }}
                  onClick={() => setShowAvatarPicker(true)}
                />
                <button onClick={() => setShowAvatarPicker(true)} style={{
                  position: "absolute", bottom: "4px", right: "4px",
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--purple-dark)", color: "var(--bg)",
                  border: `3px solid var(--bg)`, cursor: "pointer",
                  fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center"
                }}>+</button>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "12px", fontFamily: "Inter, sans-serif" }}>
                Tap to set photo
              </p>
            </div>

            <button className="btn-primary" onClick={handleNext} style={{ fontSize: "16px", padding: "16px" }}>
              {avatarUrl ? "Looks good! →" : "Skip for now →"}
            </button>
          </div>
        )}

        {/* ── SLIDE 1: Username ── */}
        {step === 1 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>👤</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              What's your name?
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px", fontFamily: "Inter, sans-serif" }}>
              This is how others will see you in groups and chats.
            </p>
            <div style={{ marginBottom: "32px" }}>
              <label className="input-label">Username *</label>
              <input
                className="input-underline"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="e.g. jamie123"
                autoFocus
                style={{ fontSize: "22px", paddingBottom: "12px" }}
                onKeyDown={e => e.key === "Enter" && canNext() && handleNext()}
              />
            </div>
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!username.trim()}
              style={{ fontSize: "16px", padding: "16px" }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── SLIDE 2: Major + Year ── */}
        {step === 2 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🎓</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              What do you study?
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px", fontFamily: "Inter, sans-serif" }}>
              We use this to help match you with compatible people.
            </p>
            <div style={{ marginBottom: "20px" }}>
              <label className="input-label">Major *</label>
              <input
                className="input-underline"
                value={major}
                onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Computer Science"
                autoFocus
                style={{ fontSize: "18px", paddingBottom: "10px" }}
              />
            </div>
            <div style={{ marginBottom: "32px" }}>
              <label className="input-label">Year of Study *</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                {["1", "2", "3", "4", "grad"].map(y => (
                  <button key={y} onClick={() => setYear(y)} style={{
                    padding: "10px 20px", borderRadius: "20px",
                    border: `1.5px solid ${year === y ? "var(--purple-dark)" : "var(--border)"}`,
                    background: year === y ? "var(--purple-dark)" : "var(--card)",
                    color: year === y ? "var(--bg)" : "var(--text)",
                    fontSize: "14px", fontWeight: "600",
                    cursor: "pointer", fontFamily: "Inter, sans-serif",
                    transition: "all 0.15s"
                  }}>
                    {y === "grad" ? "Graduate" : `Year ${y}`}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={!major.trim() || !year}
              style={{ fontSize: "16px", padding: "16px" }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── SLIDE 3: Telegram + Bio ── */}
        {step === 3 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>💬</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              Tell us about yourself
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px", fontFamily: "Inter, sans-serif" }}>
              Optional — you can always add these later.
            </p>
            <div style={{ marginBottom: "20px" }}>
              <label className="input-label">Telegram Handle</label>
              <input
                className="input-underline"
                value={telegram}
                onChange={e => setTelegram(e.target.value)}
                placeholder="@username"
                autoFocus
                style={{ fontSize: "17px", paddingBottom: "10px" }}
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>
                🔒 Only visible to mutual friends
              </p>
            </div>
            <div style={{ marginBottom: "32px" }}>
              <label className="input-label">Bio</label>
              <textarea
                className="input-underline"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                style={{ fontSize: "15px", resize: "none", height: "80px", paddingTop: "8px" }}
              />
            </div>
            <button className="btn-primary" onClick={handleNext} style={{ fontSize: "16px", padding: "16px" }}>
              {telegram || bio ? "Next →" : "Skip →"}
            </button>
          </div>
        )}

        {/* ── SLIDE 4: Interests ── */}
        {step === 4 && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            <p style={{ fontSize: "28px", margin: "0 0 8px" }}>🎯</p>
            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              What are you into?
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 24px", fontFamily: "Inter, sans-serif" }}>
              Add at least 1 interest — this is how we match you with people!
            </p>

            {/* Search input */}
            <div style={{ position: "relative", marginBottom: "16px" }}>
              <input
                className="input-underline"
                value={interestInput}
                onChange={e => setInterestInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && interestInput.trim()) {
                    addInterest(interestInput.trim());
                  }
                }}
                placeholder="Type an interest + Enter to add..."
                autoFocus
                style={{ fontSize: "16px", paddingBottom: "10px" }}
              />

              {/* Suggestions */}
              {filteredSuggestions.length > 0 && (
                <div style={{
                  position: "absolute", top: "100%", left: 0, right: 0,
                  background: "var(--card)", border: `1px solid var(--border)`,
                  borderRadius: "10px", zIndex: 10, overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                  {filteredSuggestions.map(s => (
                    <div key={s} onClick={() => addInterest(s)} style={{
                      padding: "10px 14px", cursor: "pointer",
                      fontSize: "14px", color: "var(--text)",
                      fontFamily: "Inter, sans-serif",
                      borderBottom: `1px solid var(--border)`,
                      transition: "background 0.1s"
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--purple-light)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected interests */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px", minHeight: "40px" }}>
              {interests.map(i => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  padding: "6px 12px", borderRadius: "20px",
                  background: "var(--purple-dark)", color: "var(--bg)",
                  fontSize: "13px", fontFamily: "Inter, sans-serif", fontWeight: "500"
                }}>
                  {i}
                  <button onClick={() => removeInterest(i)} style={{
                    background: "none", border: "none", color: "rgba(255,255,255,0.7)",
                    cursor: "pointer", fontSize: "14px", padding: 0, lineHeight: 1
                  }}>×</button>
                </span>
              ))}
              {interests.length === 0 && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>
                  No interests added yet
                </p>
              )}
            </div>

            {/* Popular suggestions */}
            {interests.length < 3 && !interestInput && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: "600" }}>
                  Popular
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {["AI", "Hackathons", "Music", "Gaming", "Basketball", "Photography", "Cooking", "Travel", "Startups", "Design"].filter(i => !interests.includes(i.toLowerCase())).slice(0, 8).map(s => (
                    <button key={s} onClick={() => addInterest(s)} style={{
                      padding: "6px 14px", borderRadius: "20px",
                      border: `1px solid var(--border)`,
                      background: "var(--card)", color: "var(--text)",
                      fontSize: "13px", cursor: "pointer",
                      fontFamily: "Inter, sans-serif", fontWeight: "500"
                    }}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={interests.length === 0}
              style={{ fontSize: "16px", padding: "16px" }}
            >
              Next →
            </button>
          </div>
        )}

        {/* ── SLIDE 5: Done ── */}
        {step === 5 && (
          <div style={{ animation: "fadeUp 0.3s ease", textAlign: "center" }}>
            <p style={{ fontSize: "64px", margin: "0 0 16px", animation: "fadeUp 0.4s ease" }}>🎉</p>
            <h2 style={{ fontSize: "26px", fontWeight: "700", color: "var(--text)", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
              You're all set, {username}!
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px", lineHeight: "1.6", fontFamily: "Inter, sans-serif" }}>
              Your profile is ready. Let's find you some groups based on your interests!
            </p>

            {/* Profile preview */}
            <div style={{
              padding: "20px", borderRadius: "16px",
              border: `1px solid var(--border)`, background: "var(--card)",
              marginBottom: "32px", textAlign: "left"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <img
                  src={avatarUrl || defaultAvatar}
                  alt="avatar"
                  style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover", border: `2px solid var(--border)` }}
                />
                <div>
                  <p style={{ fontWeight: "700", fontSize: "16px", margin: "0 0 2px", color: "var(--text)", fontFamily: "Inter, sans-serif" }}>{username}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>{major} · Year {year}</p>
                </div>
              </div>
              {interests.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {interests.map(i => (
                    <span key={i} style={{
                      padding: "3px 10px", borderRadius: "20px",
                      background: "var(--purple-light)", color: "var(--purple-dark)",
                      fontSize: "12px", fontFamily: "Inter, sans-serif"
                    }}>{i}</span>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
              style={{ fontSize: "16px", padding: "16px" }}
            >
              {saving ? "Saving..." : "Let's go! 🚀"}
            </button>
          </div>
        )}
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentPhoto={avatarUrl}
          onSave={(url) => { setAvatarUrl(url); setShowAvatarPicker(false); }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
