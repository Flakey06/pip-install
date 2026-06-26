// code use: group settings, which includes rename, photo, members, history toggle, actions
import { useState, useEffect } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, push } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";
import { leaveGroup, generateGroupName } from "../hooks/useGroups";
import MemberProfile from "../components/MemberProfile";
import AvatarPicker from "../components/AvatarPicker";
import VideoCall from "../components/VideoCall";
import MiniGame from "../components/MiniGame";

export default function GroupInfo() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [saving, setSaving] = useState(false);
  const me = auth.currentUser?.uid;

  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (user) {
        const uSnap = await getDoc(doc(db, "users", user.uid));
        if (uSnap.exists()) setProfile(uSnap.data());
      }
      const snap = await getDoc(doc(db, "groups", groupId));
      if (!snap.exists()) return;
      const data = snap.data();
      setGroupData(data);
      setNewName(data.name || "");
      const memberProfiles = await Promise.all(
        data.members.map(uid => getDoc(doc(db, "users", uid)))
      );
      setMembers(memberProfiles.filter(m => m.exists()).map(m => ({ uid: m.id, ...m.data() })));
    };
    fetch();
  }, [groupId]);

  const isAdmin = groupData?.adminId === me;

  const saveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await updateDoc(doc(db, "groups", groupId), { name: newName.trim() });
    setGroupData(p => ({ ...p, name: newName.trim() }));
    setEditingName(false);
    setSaving(false);
  };

  const randomiseName = async () => {
    const name = generateGroupName(groupData?.sharedInterests?.[0]);
    setNewName(name);
    await updateDoc(doc(db, "groups", groupId), { name });
    setGroupData(p => ({ ...p, name }));
    setEditingName(false);
  };

  const saveGroupPic = async (base64) => {
    await updateDoc(doc(db, "groups", groupId), { photoURL: base64 });
    setGroupData(p => ({ ...p, photoURL: base64 }));
    setShowAvatarPicker(false);
  };

  const toggleHistory = async () => {
    const newVal = !groupData?.historyForAll;
    await updateDoc(doc(db, "groups", groupId), { historyForAll: newVal });
    setGroupData(p => ({ ...p, historyForAll: newVal }));
  };

  const startVideoCall = async () => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    await push(messagesRef, {
      text: `${profile?.username || "Someone"} started a video call 📹 — join at meet.jit.si/pip-install-${groupId}`,
      senderId: "system", senderName: "system", senderPhoto: "",
      timestamp: Date.now(), type: "system"
    });
    setShowVideoCall(true);
  };

  const handleLeave = async () => {
    if (!window.confirm("Leave this group?")) return;
    await leaveGroup(groupId);
    navigate("/groups");
  };

  if (!groupData) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "white", paddingBottom: "40px" }}>

      <div className="header">
        <button onClick={() => navigate(`/chat/${groupId}`)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">Group Info</span>
        <div style={{ width: "20px" }} />
      </div>

      <div style={{ padding: "24px 16px 20px", textAlign: "center", borderBottom: "1px solid var(--border)" }}>
        {/* Avatar */}
        <div style={{ position: "relative", display: "inline-block", marginBottom: "14px" }}>
          <div style={{
            width: "90px", height: "90px", borderRadius: "50%",
            background: "#f0f0f0", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", margin: "0 auto", overflow: "hidden"
          }}>
            {groupData.photoURL
              ? <img src={groupData.photoURL} alt="group" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "💬"
            }
          </div>
          {/* Anyone can change group pic */}
          <button onClick={() => setShowAvatarPicker(true)} style={{
            position: "absolute", bottom: 2, right: 2,
            width: "26px", height: "26px", borderRadius: "50%",
            background: "#0f0f0f", color: "white",
            border: "2px solid white", cursor: "pointer",
            fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center"
          }}>✎</button>
        </div>

        {/* edit name */}
        {editingName ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && saveName()}
              autoFocus
              style={{
                border: "none", borderBottom: "1.5px solid #0f0f0f",
                fontSize: "18px", fontWeight: "700", textAlign: "center",
                outline: "none", background: "transparent",
                fontFamily: "Inter, sans-serif", width: "100%", maxWidth: "280px"
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={randomiseName} style={{
                background: "#f5f5f5", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "6px 12px", fontSize: "12px",
                cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: "600"
              }}>🎲 Random</button>
              <button onClick={saveName} disabled={saving} style={{
                background: "#0f0f0f", color: "white", border: "none",
                borderRadius: "8px", padding: "6px 16px", fontSize: "12px",
                cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: "600"
              }}>{saving ? "..." : "Save"}</button>
              <button onClick={() => setEditingName(false)} style={{
                background: "none", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "6px 12px", fontSize: "12px",
                cursor: "pointer", fontFamily: "Inter, sans-serif"
              }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontWeight: "700", fontSize: "20px", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>
              {groupData.name}
              {/* change name */}
              <button onClick={() => setEditingName(true)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#8e8e8e", fontSize: "14px", marginLeft: "6px", verticalAlign: "middle"
              }}>✎</button>
            </p>
            <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
              {members.length}/6 members
            </p>
          </div>
        )}
      </div>

      {/* Shared interests */}
      {groupData.sharedInterests?.length > 0 && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <p className="section-label" style={{ padding: 0, marginBottom: "8px" }}>Common Interests</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {groupData.sharedInterests.map(i => (
              <span key={i} className="tag">{i}</span>
            ))}
          </div>
        </div>
      )}

      {/* Edit, Call, Games, Calendar */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <p className="section-label" style={{ padding: 0, marginBottom: "10px" }}>Actions</p>
        <div style={{ display: "flex", gap: "10px" }}>
          {[
            { icon: "✏️", label: "Edit", action: () => setEditingName(true) },
            { icon: "📹", label: "Call", action: startVideoCall },
            { icon: "🎮", label: "Games", action: () => setShowGame(true) },
            { icon: "📅", label: "Calendar", action: () => navigate(`/calendar/${groupId}`) },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: "4px",
              padding: "10px 0", background: "#fafafa",
              border: "1px solid var(--border)", borderRadius: "12px",
              cursor: "pointer", fontFamily: "Inter, sans-serif"
            }}>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#0f0f0f" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1, marginRight: "16px" }}>
              <p style={{ fontWeight: "600", fontSize: "15px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>
                Chat History for New Members
              </p>
              <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {groupData.historyForAll
                  ? "New members can see all past messages"
                  : "New members only see messages after joining"}
              </p>
            </div>
            <div onClick={toggleHistory} style={{
              width: "44px", height: "26px", borderRadius: "13px",
              background: groupData.historyForAll ? "#0f0f0f" : "#ddd",
              cursor: "pointer", position: "relative",
              transition: "background 0.2s", flexShrink: 0
            }}>
              <div style={{
                position: "absolute", top: "3px",
                left: groupData.historyForAll ? "21px" : "3px",
                width: "20px", height: "20px", borderRadius: "50%",
                background: "white", transition: "left 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
              }} />
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="section-label">{members.length} Members</p>
        {members.map((m, i) => (
          <div key={m.uid}>
            <div className="list-row"
              onClick={() => m.uid !== me && setSelectedMember(m.uid)}
              style={{ cursor: m.uid !== me ? "pointer" : "default" }}>
              <img src={m.photoURL} alt={m.username} style={{
                width: "44px", height: "44px", borderRadius: "50%",
                objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)"
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <p style={{ fontWeight: "600", fontSize: "15px", margin: 0, fontFamily: "Inter, sans-serif" }}>
                    {m.username}
                  </p>
                  {m.uid === me && (
                    <span style={{ fontSize: "11px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>you</span>
                  )}
                  {groupData.adminId === m.uid && (
                    <span style={{
                      fontSize: "10px", color: "var(--purple-dark)",
                      fontWeight: "700", background: "var(--purple-light)",
                      padding: "1px 6px", borderRadius: "4px",
                      fontFamily: "Inter, sans-serif"
                    }}>Admin</span>
                  )}
                </div>
                <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "2px 0 0", fontFamily: "Inter, sans-serif" }}>
                  {m.major} · Year {m.year}
                </p>
              </div>
              {m.uid !== me && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e8e" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </div>
            {i < members.length - 1 && <div className="divider" />}
          </div>
        ))}
      </div>

      {/* Leave */}
      <div style={{ padding: "20px 16px 0" }}>
        <button onClick={handleLeave} style={{
          width: "100%", padding: "14px", background: "white",
          border: "1px solid #ed4956", borderRadius: "12px",
          color: "#ed4956", fontSize: "15px", fontWeight: "600",
          cursor: "pointer", fontFamily: "Inter, sans-serif"
        }}>
          Leave Group
        </button>
      </div>

      {selectedMember && <MemberProfile uid={selectedMember} onClose={() => setSelectedMember(null)} />}
      {showAvatarPicker && (
        <AvatarPicker
          currentPhoto={groupData.photoURL}
          onSave={saveGroupPic}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      {showVideoCall && (
        <VideoCall groupId={groupId} groupName={groupData?.name} onClose={() => setShowVideoCall(false)} />
      )}
      {showGame && (
        <MiniGame groupId={groupId} groupName={groupData?.name} members={members} onClose={() => setShowGame(false)} />
      )}
    </div>
  );
}
