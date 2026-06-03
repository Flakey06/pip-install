import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, getDoc, serverTimestamp, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function Explore() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTopic, setNewGroupTopic] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [userGroups, setUserGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
    fetchUserGroups();
  }, []);

  const fetchGroups = async () => {
    const snap = await getDocs(collection(db, "groups"));
    const allGroups = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setGroups(allGroups);
    setLoading(false);
  };

  const fetchUserGroups = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) setUserGroups(snap.data().groups || []);
  };

  const handleJoin = async (group) => {
    const uid = auth.currentUser.uid;
    if (userGroups.length >= 7) {
      setMessage("❌ You're in 7 groups already — leave one first!");
      return;
    }
    if (group.members?.includes(uid)) {
      navigate(`/chat/${group.id}`);
      return;
    }
    if ((group.members?.length || 0) >= 6) {
      setMessage("❌ This group is full!");
      return;
    }
    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(uid),
      memberCount: (group.members?.length || 0) + 1
    });
    await updateDoc(doc(db, "users", uid), {
      groups: arrayUnion(group.id)
    });
    setUserGroups(prev => [...prev, group.id]);
    setMessage("✅ Joined! Opening chat...");
    setTimeout(() => navigate(`/chat/${group.id}`), 800);
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) { alert("Please enter a group name!"); return; }
    if (!newGroupTopic.trim()) { alert("Please enter at least one interest/topic!"); return; }
    if (userGroups.length >= 7) {
      setMessage("❌ You're in 7 groups already — leave one first!");
      return;
    }
    setCreating(true);
    const uid = auth.currentUser.uid;
    const topics = newGroupTopic.split(",").map(t => t.toLowerCase().trim()).filter(Boolean);

    const newGroup = await addDoc(collection(db, "groups"), {
      name: newGroupName.trim(),
      members: [uid],
      memberCount: 1,
      sharedInterests: topics,
      adminId: uid,
      type: "interest",
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "users", uid), {
      groups: arrayUnion(newGroup.id)
    });

    setCreating(false);
    setShowCreate(false);
    setNewGroupName("");
    setNewGroupTopic("");
    setMessage("✅ Group created!");
    await fetchGroups();
    setTimeout(() => navigate(`/chat/${newGroup.id}`), 800);
  };

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.sharedInterests?.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", paddingTop: "60px", paddingBottom: "60px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>←</button>
          <h2 style={{ margin: "0 0 0 12px", color: "#1a1a1a", fontSize: "22px" }}>Explore Groups 🔍</h2>
        </div>

        {/* Search bar */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or interest..."
          style={{
            width: "100%", padding: "12px 16px",
            borderRadius: "12px", border: "1.5px solid #e0e0e0",
            fontSize: "15px", outline: "none", marginBottom: "12px",
            boxSizing: "border-box", color: "#1a1a1a"
          }}
        />

        {/* Create group button */}
        <button
          onClick={() => setShowCreate(!showCreate)}
          style={{
            width: "100%", padding: "14px", background: showCreate ? "#f5f5ff" : "#4F46E5",
            color: showCreate ? "#4F46E5" : "white",
            border: showCreate ? "2px solid #4F46E5" : "none",
            borderRadius: "12px", cursor: "pointer",
            fontSize: "16px", fontWeight: "bold", marginBottom: "16px",
            boxShadow: showCreate ? "none" : "0 4px 12px rgba(79,70,229,0.3)"
          }}
        >
          {showCreate ? "Cancel" : "➕ Create a Group"}
        </button>

        {/* Create group form */}
        {showCreate && (
          <div style={{
            background: "rgba(79,70,229,0.05)", borderRadius: "16px",
            padding: "16px", marginBottom: "20px",
            border: "1px solid rgba(79,70,229,0.15)"
          }}>
            <h3 style={{ margin: "0 0 14px", color: "#1a1a1a", fontSize: "16px" }}>
              Create Interest Group
            </h3>
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Group name e.g. Basketball Fans SG"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px",
                border: "1.5px solid #e0e0e0", fontSize: "14px",
                outline: "none", marginBottom: "10px",
                boxSizing: "border-box", color: "#1a1a1a"
              }}
            />
            <input
              value={newGroupTopic}
              onChange={e => setNewGroupTopic(e.target.value)}
              placeholder="Topics e.g. basketball, sports, fitness"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "10px",
                border: "1.5px solid #e0e0e0", fontSize: "14px",
                outline: "none", marginBottom: "12px",
                boxSizing: "border-box", color: "#1a1a1a"
              }}
            />
            <p style={{ fontSize: "11px", color: "#888", marginBottom: "12px" }}>
              Separate multiple topics with commas. You'll be the admin of this group.
            </p>
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: "100%", padding: "12px", background: "#4F46E5",
                color: "white", border: "none", borderRadius: "10px",
                cursor: "pointer", fontSize: "15px", fontWeight: "bold"
              }}
            >
              {creating ? "Creating..." : "Create Group 🚀"}
            </button>
          </div>
        )}

        {message && (
          <div style={{
            padding: "12px", borderRadius: "10px",
            background: "#f5f5ff", color: "#4F46E5",
            fontSize: "14px", marginBottom: "16px", textAlign: "center"
          }}>
            {message}
          </div>
        )}

        {/* Groups list */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#aaa" }}>Loading groups...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", marginTop: "40px" }}>
            <p style={{ fontSize: "32px" }}>🔍</p>
            <p>No groups found!</p>
            <p style={{ fontSize: "13px" }}>Create one above 👆</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filtered.map(group => {
              const isMember = userGroups.includes(group.id);
              const isFull = (group.members?.length || 0) >= 6;
              const memberCount = group.members?.length || 0;

              return (
                <div key={group.id} style={{
                  background: "rgba(79,70,229,0.04)",
                  borderRadius: "16px", padding: "16px",
                  border: isMember ? "1.5px solid #4F46E5" : "1px solid rgba(79,70,229,0.1)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: "0 0 2px", color: "#1a1a1a", fontSize: "15px" }}>
                        {group.name}
                        {group.adminId && (
                          <span style={{
                            marginLeft: "6px", fontSize: "10px",
                            background: "#f5f5ff", color: "#4F46E5",
                            padding: "2px 6px", borderRadius: "4px"
                          }}>
                            Interest group
                          </span>
                        )}
                      </h3>
                      <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                        {memberCount}/6 members
                      </p>
                    </div>
                    {isMember && (
                      <span style={{
                        fontSize: "11px", color: "#4F46E5",
                        fontWeight: "bold", background: "#f5f5ff",
                        padding: "3px 8px", borderRadius: "6px"
                      }}>
                        Joined ✓
                      </span>
                    )}
                  </div>

                  {group.sharedInterests?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                      {group.sharedInterests.map(i => (
                        <span key={i} style={{
                          padding: "3px 10px", borderRadius: "20px",
                          background: "#4F46E5", color: "white", fontSize: "11px"
                        }}>
                          {i}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleJoin(group)}
                    style={{
                      width: "100%", padding: "10px",
                      background: isMember ? "#f5f5ff" : isFull ? "#f0f0f0" : "#4F46E5",
                      color: isMember ? "#4F46E5" : isFull ? "#888" : "white",
                      border: isMember ? "1.5px solid #4F46E5" : "none",
                      borderRadius: "10px",
                      cursor: isFull && !isMember ? "default" : "pointer",
                      fontSize: "14px", fontWeight: "bold"
                    }}
                  >
                    {isMember ? "💬 Open Chat" : isFull ? "🔒 Full" : "➕ Join Group"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
