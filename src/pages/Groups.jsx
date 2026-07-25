// code's use: messages tab, list of groups with unread badges
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { leaveGroup, MIN_MEMBERS_FOR_CHAT } from "../hooks/useGroups";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import MemberProfile from "../components/MemberProfile";
import TabBar from "../components/TabBar";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [activeTab, setActiveTab] = useState("friends");
  const [maxGroups, setMaxGroups] = useState(5);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), async snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      const regularGroupIds = data.groups || [];
      const openInviteGroupIds = data.openInviteGroups || [];
      const allGroupIds = [...new Set([...regularGroupIds, ...openInviteGroupIds])];
      const groupDocs = await Promise.all(allGroupIds.map(id => getDoc(doc(db, "groups", id))));
      const groupList = groupDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() }));
      setGroups(groupList);
      setMaxGroups(data.maxGroups || 5);

      const friendSnaps = await getDocs(collection(db, "friends"));
      const myFriendUids = friendSnaps.docs.filter(d => d.id.startsWith(`${user.uid}_`)).map(d => d.data().uid);
      const fp = await Promise.all(myFriendUids.map(uid => getDoc(doc(db, "users", uid))));
      setFriends(fp.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));

      const reqSnaps = await getDocs(collection(db, "friendRequests"));
      const incomingUids = reqSnaps.docs.filter(d => d.data().toUid === user.uid && d.data().status === "pending").map(d => d.data().fromUid);
      const rp = await Promise.all(incomingUids.map(uid => getDoc(doc(db, "users", uid))));
      setRequests(rp.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { unreadCounts, totalUnread } = useUnreadMessages(groups.map(g => g.id));

  const handleLeave = async (e, groupId) => {
    e.stopPropagation();
    if (!window.confirm("Leave this group?")) return;
    await leaveGroup(groupId);
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <span className="header-title">Messages</span>
        <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>
          {((groups || []).filter(group => group.type !== "openInvite")).length}/{maxGroups} groups
        </span>
      </div>

      <div style={{ display: "flex", gap: "8px", padding: "10px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
        <button onClick={() => setActiveTab("friends")} style={{ flex: 1, padding: "10px 12px", borderRadius: "999px", border: activeTab === "friends" ? "none" : "1px solid var(--border)", background: activeTab === "friends" ? "var(--purple-dark)" : "var(--card)", color: activeTab === "friends" ? "white" : "var(--text)", fontWeight: "700" }}>
          Friends
        </button>
        <button onClick={() => setActiveTab("groups")} style={{ flex: 1, padding: "10px 12px", borderRadius: "999px", border: activeTab === "groups" ? "none" : "1px solid var(--border)", background: activeTab === "groups" ? "var(--purple-dark)" : "var(--card)", color: activeTab === "groups" ? "white" : "var(--text)", fontWeight: "700" }}>
          Group chats
        </button>
      </div>

      {activeTab === "friends" ? (
        <div style={{ padding: "12px 16px", background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={{ fontSize: "13px", fontWeight: "700", margin: 0 }}>Friends</p>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{friends.length} connected</span>
          </div>

          {requests.length > 0 && (
            <div style={{ marginBottom: "10px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px" }}>Friend requests</p>
              {requests.map((r) => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0" }}>
                  <img src={r.photoURL} alt={r.username} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover" }} />
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{r.username}</span>
                </div>
              ))}
            </div>
          )}

          {friends.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>Add friends from group chats to message them privately.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {friends.map((friend) => (
                <div key={friend.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }} onClick={() => setSelectedUid(friend.id)}>
                    <img src={friend.photoURL} alt={friend.username} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: "600", fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{friend.username}</p>
                      <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{friend.major || friend.telegram || "NUS member"}</p>
                    </div>
                  </div>
                  <button onClick={() => navigate(`/private-chat/${friend.id}`)} style={{ background: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer", color: "var(--text)" }}>
                    Message
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ padding: "10px 16px", background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>
              Group chats
            </p>
            <button
              onClick={() => navigate("/explore")}
              style={{
                background: "none", border: "none", color: "var(--purple-dark)",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
                fontFamily: "Inter, sans-serif"
              }}
            >
              Find groups →
            </button>
          </div>

          {groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h3>No messages yet</h3>
          <p style={{ marginBottom: "16px" }}>Join or get matched into a group to start chatting.</p>
          <button className="text-btn" onClick={() => navigate("/explore")}>
            Explore Groups →
          </button>
        </div>
      ) : (

        [...groups].sort((a, b) => {
          const unreadA = unreadCounts[a.id] || 0;
          const unreadB = unreadCounts[b.id] || 0;
          return unreadB - unreadA;
        }).map((group, i) => {
          const canChat = (group.members?.length || 0) >= MIN_MEMBERS_FOR_CHAT;
          const unread = unreadCounts[group.id] || 0;
          return (
            <div key={group.id}>
              <div className="list-row" onClick={() => canChat && navigate(`/chat/${group.id}`)}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  background: "var(--border)", flexShrink: 0,
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "20px"
                }}>
                  {group.photoURL
                    ? <img src={group.photoURL} alt={group.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : canChat ? "💬" : "⏳"
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: "600", fontSize: "15px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }}>
                      {group.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {unread > 0 && (
                        <span style={{ background: "var(--purple-dark)", color: "var(--bg)", borderRadius: "10px", fontSize: "11px", fontWeight: "700", padding: "1px 7px" }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {canChat ? (group.sharedInterests?.join(", ") || "No common interests") : "Waiting for more members..."}
                  </p>
                </div>
                <button onClick={e => handleLeave(e, group.id)} style={{
                  background: "none", border: "none", color: "#ed4956",
                  fontSize: "12px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "Inter, sans-serif", flexShrink: 0
                }}>
                  Leave
                </button>
              </div>
              {i < groups.length - 1 && <div className="divider" />}
            </div>
          );
        })
          )}
        </>
      )}
      <TabBar unread={totalUnread} />
      {selectedUid && <MemberProfile uid={selectedUid} onClose={() => setSelectedUid(null)} />}
    </div>
  );
}
