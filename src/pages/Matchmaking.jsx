import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useInterests } from "../hooks/useInterests";
import InterestSelector from "../components/InterestSelector";
import { joinStandardGroup,
          joinPreciseGroup,
          joinSimilarGroup,
          joinFilteredGroup,
          joinRandomGroup } from "../hooks/useGroups";

export default function Matchmaking() {
  const [userProfile, setUserProfile] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joiningMode, setJoiningMode] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [showFilteredPopup, setShowFilteredPopup] = useState(false);
  const [blacklistedInterests, setBlacklistedInterests] = useState([]);
  const { allInterests } = useInterests();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setUserProfile(data);
      setUserGroups(data.groups || []);
    }
    setLoading(false);
  };

  const handleStandardMatch = async (mode = "surprise") => {
    try {
      if (!userProfile) return;

      if (userGroups.length >= (userProfile?.maxGroups || 5)) {
        setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`);
        return;
      }

      setJoining(true);
      setJoiningMode(mode);
      setMessage("");

      console.log("Starting standard match...");
      console.log(userProfile);

      const result = await joinStandardGroup(userProfile);

      console.log("Match result:", result);

      if (result.success) {
        if (result.waitingForMembers) {
          setMessage("Group created! Waiting for others...");
          await fetchProfile();
        } else {
          setMessage("Matched!");
          setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
        }
      } else {
        setMessage("Could not find a match.");
      }
    } catch (err) {
      console.error("MATCH ERROR:", err);
      setMessage(err.message);
    }

    setJoining(false);
    setJoiningMode("");
  };

  const handlePreciseMatch = async (mode = "surprise") => {
    if (!userProfile) return;
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    setJoining(true); setJoiningMode(mode); setMessage("");
    const result = await joinPreciseGroup(userProfile, mode);
    if (result.success) {
      if (result.waitingForMembers) {
        setMessage("Group created! Waiting for others with similar interests...");
        await fetchProfile();
      } else {
        setMessage("Matched into a group!");
        setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
      }
    } else {
      setMessage("Could not find a match right now. Try creating a group!");
    }
    setJoining(false); setJoiningMode("");
  };

  const handleSimilarMatch = async (mode = "surprise") => {
    if (!userProfile) return;
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    setJoining(true); setJoiningMode(mode); setMessage("");
    const result = await joinSimilarGroup(userProfile, mode);
    if (result.success) {
      if (result.waitingForMembers) {
        setMessage("Group created! Waiting for others with similar interests...");
        await fetchProfile();
      } else {
        setMessage("Matched into a group!");
        setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
      }
    } else {
      setMessage("Could not find a match right now. Try creating a group!");
    }
    setJoining(false); setJoiningMode("");
  };

 const handleFilteredMatch = async (blacklistedInterests = []) => {
  if (!userProfile) return;

  if (userGroups.length >= (userProfile?.maxGroups || 5)) {
    setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`);
    return;
  }

  setJoining(true);
  setJoiningMode("filtered"); // ✅ changed from "surprise" so button loading state is separate
  setMessage("");

  // ✅ pass the popup blacklist array into your filtered matcher
  const result = await joinFilteredGroup(userProfile, blacklistedInterests);

  if (result.success) {
    if (result.waitingForMembers) {
      setMessage("Group created! Waiting for others with similar interests...");
      await fetchProfile();
    } else {
      setMessage("Matched into a group!");
      setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
    }
  } else {
    setMessage("Could not find a match right now. Try creating a group!");
  }

  setJoining(false);
  setJoiningMode("");
};

  const handleRandomMatch = async (mode = "surprise") => {
    if (!userProfile) return;
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    setJoining(true); setJoiningMode(mode); setMessage("");
    const result = await joinRandomGroup(userProfile, mode);
    if (result.success) {
      if (result.waitingForMembers) {
        setMessage("Group created! Waiting for others with similar interests...");
        await fetchProfile();
      } else {
        setMessage("Matched into a group!");
        setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
      }
    } else {
      setMessage("Could not find a match right now. Try creating a group!");
    }
    setJoining(false); setJoiningMode("");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <button onClick={() => navigate("/explore")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">Matchmaking</span>
        <div style={{ width: "20px" }} />
      </div>

      {message && (
        <p style={{ padding: "10px 16px", fontSize: "13px", color: message.startsWith("❌") ? "#ed4956" : "#2e7d32", borderBottom: "1px solid var(--border)", fontFamily: "Inter, sans-serif" }}>
          {message}
        </p>
      )}

      <div style={{
        margin: "12px 16px",
        padding: "14px 16px",
        background: "#fafafa",
        borderRadius: "12px",
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
            🎲 Standard Match
          </p>
          <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
            Find your people with our matching algorithm
          </p>
        </div>
        <button
          onClick={() => handleStandardMatch("surprise")}
          disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
          style={{
            background: "#0f0f0f", color: "white", border: "none",
            borderRadius: "8px", padding: "8px 16px",
            fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
            fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1,
            flexShrink: 0
          }}
        >
          {joining && joiningMode === "surprise" ? "Matching..." : "Match me"}
        </button>
      </div>

      <div style={{ margin: "0 16px 12px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{
          padding: "14px 16px",
          background: "#fafafa",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
              🎯 Precise match
            </p>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Find people who share your specific interest
            </p>
          </div>
          <button
            onClick={() => handlePreciseMatch("common-interests")}
            disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
            style={{
              background: "#0f0f0f", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1,
              flexShrink: 0
            }}
          >
            {joining && joiningMode === "common-interests" ? "Matching..." : "Match me"}
          </button>
        </div>

        <div style={{
          padding: "14px 16px",
          background: "#fafafa",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
              🧭 Similarity match
            </p>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Find people who have similar areas of interest (e.g. sports)
            </p>
          </div>
          <button
            onClick={() => handleSimilarMatch("common-areas")}
            disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
            style={{
              background: "#0f0f0f", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1,
              flexShrink: 0
            }}
          >
            {joining && joiningMode === "common-areas" ? "Matching..." : "Match me"}
          </button>
        </div>
        
        {showFilteredPopup && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000
          }}>
            <div style={{
              width: "100%",
              maxWidth: "360px",
              background: "white",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              padding: "16px",
              fontFamily: "Inter, sans-serif"
            }}>
              <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 6px" }}>
                Filtered match
              </p>

              <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 14px" }}>
                Enter interests you do not want to match with.
              </p>

              <InterestSelector
                interests={blacklistedInterests}
                setInterests={setBlacklistedInterests}
                allInterests={allInterests}
                allowCustom={false}
                label="Blocked interests"
                emptyText="No blocked interests selected yet."
                placeholder="Search interests to block..."
              />

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setShowFilteredPopup(false)}
                  style={{
                    background: "transparent",
                    color: "#0f0f0f",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={() => {
                    setShowFilteredPopup(false);
                    handleFilteredMatch(blacklistedInterests);
                  }}
                  disabled={joining}
                  style={{
                    background: "#0f0f0f",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: joining ? "default" : "pointer",
                    fontFamily: "Inter, sans-serif"
                  }}
                >
                  Find match
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{
          padding: "14px 16px",
          background: "#fafafa",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
              ✨ Filtered match
            </p>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Our standard model, but for when you really don't like something
            </p>
          </div>
          <button
            onClick={() => setShowFilteredPopup(true)}
            disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
            style={{
              background: "#0f0f0f", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1,
              flexShrink: 0
            }}
          >
            {joining && joiningMode === "filtered" ? "Matching..." : "Match me"}
          </button>
        </div>

        <div style={{
          padding: "14px 16px",
          background: "#fafafa",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
              ✨ Surprise me
            </p>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Meet someone completely new, pooling from all groups
            </p>
          </div>
          <button
            onClick={() => handleRandomMatch("surprise")}
            disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
            style={{
              background: "#0f0f0f", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1,
              flexShrink: 0
            }}
          >
            {joining && joiningMode === "surprise" ? "Matching..." : "Match me"}
          </button>
        </div>
      </div>
    </div>
  );
}
