import { useState, useEffect, useRef } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";

function GroupChat() {
  const { groupId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [profile, setProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Fetch current user profile
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    fetchProfile();
  }, []);

  // Fetch group data + members
  useEffect(() => {
    const fetchGroup = async () => {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (!snap.exists()) return;
      const data = snap.data();
      setGroupData(data);

      // Fetch each member's profile
      const memberProfiles = await Promise.all(
        data.members.map(uid => getDoc(doc(db, "users", uid)))
      );
      setMembers(memberProfiles.map(m => m.data()).filter(Boolean));
    };
    fetchGroup();
  }, [groupId]);

  // Listen to real-time messages
  useEffect(() => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setMessages([]); return; }
      const parsed = Object.entries(data).map(([id, msg]) => ({
        id, ...msg
      })).sort((a, b) => a.timestamp - b.timestamp);
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const user = auth.currentUser;
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    await push(messagesRef, {
      text: newMessage.trim(),
      senderId: user.uid,
      senderName: profile?.username || "Anonymous",
      senderPhoto: user.photoURL,
      timestamp: serverTimestamp()
    });
    setNewMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const isMe = (senderId) => senderId === auth.currentUser?.uid;

  return (
    <div style={{
      minHeight: "100vh", background: "white",
      display: "flex", flexDirection: "column",
      maxWidth: "480px", margin: "0 auto"
    }}>

      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", gap: "12px",
        position: "sticky", top: 0, background: "white", zIndex: 10
      }}>
        <button
          onClick={() => navigate("/home")}
          style={{
            background: "none", border: "none",
            fontSize: "20px", cursor: "pointer", padding: "4px"
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#1a1a1a" }}>
            {groupData?.name || "Group Chat"}
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
            {members.length} members
          </p>
        </div>
        {/* Member avatars */}
        <div style={{ display: "flex" }}>
          {members.slice(0, 4).map((m, i) => (
            <img
              key={i}
              src={m.photoURL}
              alt={m.username}
              title={m.username}
              style={{
                width: "28px", height: "28px",
                borderRadius: "50%",
                border: "2px solid white",
                marginLeft: i === 0 ? 0 : "-8px",
                objectFit: "cover"
              }}
            />
          ))}
          {members.length > 4 && (
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "#4F46E5", color: "white",
              fontSize: "11px", fontWeight: "bold",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: "-8px", border: "2px solid white"
            }}>
              +{members.length - 4}
            </div>
          )}
        </div>
      </div>

      {/* Shared interests */}
      {groupData?.sharedInterests?.length > 0 && (
        <div style={{
          padding: "10px 20px",
          background: "#f5f5ff",
          borderBottom: "1px solid #ececff",
          display: "flex", gap: "6px", flexWrap: "wrap",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "12px", color: "#4F46E5", fontWeight: "bold" }}>
            Common interests:
          </span>
          {groupData.sharedInterests.map(i => (
            <span key={i} style={{
              padding: "2px 10px", borderRadius: "20px",
              background: "#4F46E5", color: "white", fontSize: "12px"
            }}>
              {i}
            </span>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: "12px"
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#aaa", marginTop: "40px" }}>
            <p style={{ fontSize: "32px" }}>👋</p>
            <p style={{ fontSize: "14px" }}>Say hi to your group!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            flexDirection: isMe(msg.senderId) ? "row-reverse" : "row",
            alignItems: "flex-end", gap: "8px"
          }}>
            {/* Avatar */}
            {!isMe(msg.senderId) && (
              <img
                src={msg.senderPhoto}
                alt={msg.senderName}
                style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
              />
            )}

            <div style={{ maxWidth: "70%" }}>
              {/* Name (only for others) */}
              {!isMe(msg.senderId) && (
                <p style={{ margin: "0 0 4px 4px", fontSize: "11px", color: "#888" }}>
                  {msg.senderName}
                </p>
              )}
              {/* Bubble */}
              <div style={{
                padding: "10px 14px",
                borderRadius: isMe(msg.senderId)
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
                background: isMe(msg.senderId) ? "#4F46E5" : "#f0f0f0",
                color: isMe(msg.senderId) ? "white" : "#1a1a1a",
                fontSize: "14px", lineHeight: "1.5"
              }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid #f0f0f0",
        display: "flex", gap: "10px", alignItems: "flex-end",
        position: "sticky", bottom: 0, background: "white"
      }}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          style={{
            flex: 1, padding: "12px 14px",
            borderRadius: "20px",
            border: "1.5px solid #e0e0e0",
            fontSize: "14px", outline: "none",
            resize: "none", lineHeight: "1.5",
            fontFamily: "inherit", color: "#1a1a1a"
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          style={{
            width: "44px", height: "44px",
            borderRadius: "50%",
            background: newMessage.trim() ? "#4F46E5" : "#e0e0e0",
            color: "white", border: "none",
            fontSize: "18px", cursor: newMessage.trim() ? "pointer" : "default",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default GroupChat;