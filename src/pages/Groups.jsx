import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { joinRandomGroup, leaveGroup, MIN_MEMBERS_FOR_CHAT } from "../hooks/useGroups";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function Groups() {
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), async (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setProfile(data);
      const groupIds = data.groups || [];
      const groupDocs = await Promise.all(groupIds.map(id => getDoc(doc(db, "groups", id))));
      setGroups(groupDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const groupIds = groups.map(g => g.id);
  const { unreadCounts } = useUnreadMessages(groupIds);

  const handleJoin = async () => {
    if (!profile) return;
    setJoining(true); setMessage("");
    const result = await joinRandomGroup(profile);
    if (result.success) {
      setMessage(result.waitingForMembers ? "✅ Group created! Waiting for others..." : "✅ Joined!");
      if (!result.waitingForMembers) setTimeout(() => navigate(`/chat/${result.groupId}`), 800);
    } else if (result.reason === "max_groups") {
      setMessage("❌ You're in 7 groups — leave one first!");
    }
    setJoining(false);
  };

  const handleLeave = async (groupId) => {
    if (!window.confirm("Leave this group?")) return;
    await leaveGroup(groupId);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid var(--purple-light)", borderTopColor: "var(--purple)", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <>
      <div className="mesh-bg" />
      <div className="page-container">
        <div className="page-inner">

          <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
            <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text)" }}>←</button>
            <div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "24px", fontWeight: "800", color: "var(--text)", margin: 0 }}>My Groups</h1>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>{groups.length}/7 groups joined</p>
            </div>
          </div>

          <div className="fade-up-1" style={{ marginBottom: "20px" }}>
            <button className="btn-primary" onClick={handleJoin} disabled={joining || groups.length >= 7}
              style={{ opacity: groups.length >= 7 ? 0.5 : 1, fontSize: "15px" }}>
              {joining ? "Finding a group..." : "🎲 Join a Random Group"}
            </button>
          </div>

          {message && (
            <div className="fade-up" style={{
              padding: "12px 16px", borderRadius: "12px",
              background: "var(--purple-light)", color: "var(--purple-dark)",
              fontSize: "14px", fontWeight: "600", marginBottom: "16px", textAlign: "center"
            }}>
              {message}
            </div>
          )}

          {groups.length === 0 ? (
            <div className="fade-up-2" style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "60px" }}>
              <p style={{ fontSize: "48px", marginBottom: "12px" }}>🫥</p>
              <p style={{ fontWeight: "600", marginBottom: "4px" }}>No groups yet!</p>
              <p style={{ fontSize: "13px" }}>Press the button above to join one</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {groups.map((group, i) => {
                const memberCount = group.members?.length || 0;
                const canChat = memberCount >= MIN_MEMBERS_FOR_CHAT;
                const unread = unreadCounts[group.id] || 0;

                return (
                  <div key={group.id} className="card" style={{
                    animation: `fadeUp 0.4s ${i * 0.06}s ease both`,
                    border: unread > 0 ? "1.5px solid var(--purple)" : "1px solid var(--border)",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <h3 style={{ margin: 0, color: "var(--text)", fontSize: "15px", fontWeight: "700" }}>
                        {group.name}
                      </h3>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {unread > 0 && (
                          <span style={{
                            background: "#EF4444", color: "white",
                            borderRadius: "20px", fontSize: "11px",
                            fontWeight: "800", padding: "2px 8px",
                            animation: "pulse 2s infinite"
                          }}>
                            {unread} new
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", background: "var(--purple-light)", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>
                          {memberCount}/6
                        </span>
                      </div>
                    </div>

                    {group.sharedInterests?.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                        {group.sharedInterests.map(i => (
                          <span key={i} className="tag" style={{ fontSize: "11px", padding: "3px 10px" }}>{i}</span>
                        ))}
                      </div>
                    )}

                    {!canChat && (
                      <div style={{
                        padding: "8px 12px", borderRadius: "8px",
                        background: "#FFF8E1", marginBottom: "10px",
                        fontSize: "12px", color: "#854F0B", fontWeight: "500"
                      }}>
                        ⏳ Waiting for more members...
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => canChat ? navigate(`/chat/${group.id}`) : null}
                        className={canChat ? "btn-primary" : ""}
                        style={{
                          flex: 1, padding: "10px",
                          background: canChat ? undefined : "#f0f0f0",
                          color: canChat ? undefined : "#aaa",
                          border: "none", borderRadius: "10px",
                          cursor: canChat ? "pointer" : "default",
                          fontSize: "13px", fontWeight: "700",
                          boxShadow: canChat ? undefined : "none"
                        }}>
                        {canChat ? `💬 Open Chat${unread > 0 ? ` (${unread})` : ""}` : "🔒 Need 2+ members"}
                      </button>
                      <button onClick={() => handleLeave(group.id)} style={{
                        padding: "10px 14px", background: "white",
                        color: "#EF4444", border: "1.5px solid rgba(239,68,68,0.3)",
                        borderRadius: "10px", cursor: "pointer", fontSize: "13px",
                        fontWeight: "700", transition: "all 0.2s"
                      }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = "#EF4444"}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"}
                      >
                        Leave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
