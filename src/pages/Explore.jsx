import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, addDoc, doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { joinRandomGroup } from "../hooks/useGroups";
import TabBar from "../components/TabBar";

export default function Explore() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userGroups, setUserGroups] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTopics, setNewTopics] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("foryou"); // "foryou" | "all"
  const navigate = useNavigate();

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const snap = await getDocs(collection(db, "groups"));
    setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    const user = auth.currentUser;
    if (user) {
      const u = await getDoc(doc(db, "users", user.uid));
      if (u.exists()) {
        setUserGroups(u.data().groups || []);
        setUserProfile(u.data());
      }
    }
    setLoading(false);
  };

  const handleJoin = async (group) => {
    const uid = auth.currentUser.uid;
    if (userGroups.includes(group.id)) { navigate(`/chat/${group.id}`); return; } 
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    if ((group.members?.length || 0) >= 6) { setMessage("This group is full!"); return; }
    await updateDoc(doc(db, "groups", group.id), {
      members: arrayUnion(uid),
      memberCount: (group.members?.length || 0) + 1
    });
    await updateDoc(doc(db, "users", uid), { groups: arrayUnion(group.id) });
    setUserGroups(p => [...p, group.id]);
    setMessage("Joined!");
    setTimeout(() => navigate(`/chat/${group.id}`), 500);
  };

  const handleRandomMatch = async () => {
    if (!userProfile) return;
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    setJoining(true); setMessage("");
    const result = await joinRandomGroup(userProfile);
    if (result.success) {
      if (result.waitingForMembers) {
        setMessage("Group created! Waiting for others with similar interests...");
        await fetchAll();
      } else {
        setMessage("Matched into a group!");
        setTimeout(() => navigate(`/chat/${result.groupId}`), 500);
      }
    } else {
      setMessage("Could not find a match right now. Try creating a group!");
    }
    setJoining(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newTopics.trim()) { alert("Fill in all fields!"); return; }
    if (userGroups.length >= (userProfile?.maxGroups || 5)) { setMessage(`❌ You're in ${userProfile?.maxGroups || 5} groups — leave one first!`); return; }
    setCreating(true);
    const uid = auth.currentUser.uid;
    const topics = newTopics.split(",").map(t => t.toLowerCase().trim()).filter(Boolean);
    const g = await addDoc(collection(db, "groups"), {
      name: newName.trim(), members: [uid], memberCount: 1,
      sharedInterests: topics, adminId: uid,
      type: "interest", createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "users", uid), { groups: arrayUnion(g.id) });
    setCreating(false); setShowCreate(false);
    setNewName(""); setNewTopics("");
    await fetchAll();
    setTimeout(() => navigate(`/chat/${g.id}`), 400);
  };

  // For You = groups with matching interests
  const userInterests = (userProfile?.interests || []).map(i => i.toLowerCase().trim());
  const forYouGroups = groups.filter(g => {
    if (userGroups.includes(g.id)) return false;
    if ((g.members?.length || 0) >= 6) return false;
    return (g.sharedInterests || []).some(i => userInterests.includes(i.toLowerCase().trim()));
  });

  const filtered = groups.filter(g =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.sharedInterests?.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="header" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="header-title">Explore</span>
          <button className="text-btn" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? "Cancel" : "Create"}
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#8e8e8e" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search interests or groups..." />
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "#fafafa", animation: "fadeUp 0.2s ease" }}>
          <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "12px", fontFamily: "Inter, sans-serif" }}>New Interest Group</p>
          <div style={{ marginBottom: "12px" }}>
            <label className="input-label">Group Name</label>
            <input className="input-underline" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Basketball Fans SG" />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label className="input-label">Topics (comma separated)</label>
            <input className="input-underline" value={newTopics} onChange={e => setNewTopics(e.target.value)} placeholder="basketball, sports, fitness" />
          </div>
          <button className="btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Group"}
          </button>
        </div>
      )}

      {message && (
        <p style={{ padding: "10px 16px", fontSize: "13px", color: message.startsWith("❌") ? "#ed4956" : "#2e7d32", borderBottom: "1px solid var(--border)", fontFamily: "Inter, sans-serif" }}>
          {message}
        </p>
      )}

      {/* Random match banner */}
      {!search && (
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
              🎲 Random Match
            </p>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Get matched based on your interests
            </p>
          </div>
          <button
            onClick={handleRandomMatch}
            disabled={joining || userGroups.length >= (userProfile?.maxGroups || 5)}
            style={{
              background: "#0f0f0f", color: "white", border: "none",
              borderRadius: "8px", padding: "8px 16px",
              fontSize: "13px", fontWeight: "600", cursor: joining ? "default" : "pointer",
              fontFamily: "Inter, sans-serif", opacity: userGroups.length >= (userProfile?.maxGroups || 5) ? 0.4 : 1
            }}
          >
            {joining ? "Matching..." : "Match me"}
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><div className="loader" /></div>
      ) : search ? (
        /* Search results */
        <>
          <p className="section-label">Search Results ({filtered.length})</p>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              <p>No groups found for "{search}"</p>
            </div>
          ) : (
            filtered.map((group, i) => <GroupRow key={group.id} group={group} isMember={userGroups.includes(group.id)} onJoin={() => handleJoin(group)} onOpen={() => navigate(`/chat/${group.id}`)} last={i === filtered.length - 1} />)
          )}
        </>
      ) : (
        /* For You + All tabs */
        <>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
            {[["foryou", "For You"], ["all", "All Groups"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background: "none", border: "none", padding: "10px 16px 10px 0",
                fontSize: "14px", fontWeight: tab === key ? "700" : "400",
                color: tab === key ? "#0f0f0f" : "#8e8e8e",
                borderBottom: tab === key ? "2px solid #0f0f0f" : "2px solid transparent",
                cursor: "pointer", fontFamily: "Inter, sans-serif",
                marginBottom: "-1px"
              }}>
                {label}
              </button>
            ))}
          </div>

          {tab === "foryou" && (
            forYouGroups.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px" }}>
                <p>No groups match your interests yet.</p>
                <p style={{ marginTop: "8px", fontSize: "13px" }}>Try Random Match or create your own!</p>
              </div>
            ) : (
              <>
                <p className="section-label">Based on your interests</p>
                {forYouGroups.map((group, i) => (
                  <GroupRow key={group.id} group={group} isMember={userGroups.includes(group.id)}
                    onJoin={() => handleJoin(group)} onOpen={() => navigate(`/chat/${group.id}`)}
                    last={i === forYouGroups.length - 1} highlight />
                ))}
              </>
            )
          )}

          {tab === "all" && (
            groups.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px" }}>
                <p>No groups yet. Create one!</p>
              </div>
            ) : (
              <>
                <p className="section-label">All Groups ({groups.length})</p>
                {groups.map((group, i) => (
                  <GroupRow key={group.id} group={group} isMember={userGroups.includes(group.id)}
                    onJoin={() => handleJoin(group)} onOpen={() => navigate(`/chat/${group.id}`)}
                    last={i === groups.length - 1} />
                ))}
              </>
            )
          )}
        </>
      )}

      <TabBar />
    </div>
  );
}

function GroupRow({ group, isMember, onJoin, onOpen, last, highlight }) {
  const isFull = (group.members?.length || 0) >= 6;
  return (
    <>
      <div className="list-row">
        <div style={{
          width: "48px", height: "48px", borderRadius: "12px",
          background: highlight ? "#0f0f0f" : "#f5f5f5",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "20px", flexShrink: 0,
          border: "1px solid var(--border)"
        }}>
          {group.type === "interest" ? "🎯" : "🤝"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: "600", fontSize: "15px", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {group.name}
          </p>
          <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {group.sharedInterests?.join(", ")} · {group.members?.length || 0}/6 members
          </p>
        </div>
        <button onClick={isMember ? onOpen : onJoin} style={{
          background: isMember ? "transparent" : isFull ? "#f5f5f5" : "#0f0f0f",
          color: isMember ? "var(--purple-dark)" : isFull ? "#8e8e8e" : "white",
          border: isMember ? "1px solid var(--purple-dark)" : "1px solid transparent",
          borderRadius: "8px", padding: "6px 14px",
          fontSize: "13px", fontWeight: "600",
          cursor: isFull && !isMember ? "default" : "pointer",
          fontFamily: "Inter, sans-serif", flexShrink: 0
        }}>
          {isMember ? "Open" : isFull ? "Full" : "Join"}
        </button>
      </div>
      {!last && <div className="divider" />}
    </>
  );
}
