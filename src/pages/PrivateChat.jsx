// 1-1 direct messages with friends
import { useState, useEffect, useRef } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";

function PrivateChat() {
  const { friendId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [friend, setFriend] = useState(null);
  const [profile, setProfile] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const me = auth.currentUser?.uid;


  const chatId = [me, friendId].sort().join("_");

  useEffect(() => {
    const fetchProfiles = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const mySnap = await getDoc(doc(db, "users", user.uid));
      if (mySnap.exists()) setProfile(mySnap.data());
      const friendSnap = await getDoc(doc(db, "users", friendId));
      if (friendSnap.exists()) setFriend(friendSnap.data());
    };
    fetchProfiles();
  }, [friendId]);

  useEffect(() => {
    const messagesRef = ref(rtdb, `privateChats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) { setMessages([]); return; }
      const parsed = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const messagesRef = ref(rtdb, `privateChats/${chatId}/messages`);
    await push(messagesRef, {
      text: newMessage.trim(),
      senderId: me,
      senderName: profile?.username || "Me",
      senderPhoto: auth.currentUser?.photoURL || "",
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

  const isMe = (senderId) => senderId === me;

  return (
    <div style={{
      height: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      maxWidth: "480px", margin: "0 auto", overflow: "hidden"
    }}>


      <div style={{
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: "12px",
        background: "var(--bg)", flexShrink: 0
      }}>
        <button onClick={() => navigate("/friends")} style={{
          background: "none", border: "none", fontSize: "22px",
          cursor: "pointer", color: "var(--text)", flexShrink: 0
        }}>←</button>
        {friend && (
          <>
            <img src={friend.photoURL} alt={friend.username} style={{
              width: "36px", height: "36px", borderRadius: "50%",
              objectFit: "cover", border: "2px solid #4F46E5"
            }} />
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "var(--text)" }}>{friend.username}</h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#4F46E5" }}>{friend.telegram}</p>
            </div>
          </>
        )}
      </div>


      <div style={{
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: "10px"
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#bbb", marginTop: "60px" }}>
            <div style={{ fontSize: "40px", marginBottom: "8px" }}>👋</div>
            <p style={{ fontSize: "14px" }}>Start a conversation with {friend?.username}!</p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            display: "flex",
            flexDirection: isMe(msg.senderId) ? "row-reverse" : "row",
            alignItems: "flex-end", gap: "8px"
          }}>
            {!isMe(msg.senderId) && (
              <img src={msg.senderPhoto} alt={msg.senderName} style={{
                width: "26px", height: "26px", borderRadius: "50%",
                objectFit: "cover", flexShrink: 0
              }} />
            )}
            <div style={{ maxWidth: "72%" }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: isMe(msg.senderId) ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background: isMe(msg.senderId) ? "#4F46E5" : "#f0f0f0",
                color: isMe(msg.senderId) ? "white" : "#1a1a1a",
                fontSize: "14px", lineHeight: "1.5", wordBreak: "break-word"
              }}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>


      <div style={{
        padding: "12px 16px", borderTop: "1px solid var(--border)",
        display: "flex", gap: "10px", alignItems: "flex-end",
        background: "var(--bg)", flexShrink: 0
      }}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: "20px",
            border: "1.5px solid #e0e0e0", fontSize: "14px",
            outline: "none", resize: "none", lineHeight: "1.5",
            fontFamily: "inherit", color: "var(--text)", maxHeight: "120px"
          }}
        />
        <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
          width: "42px", height: "42px", borderRadius: "50%",
          background: newMessage.trim() ? "#4F46E5" : "#e0e0e0",
          color: "var(--bg)", border: "none", fontSize: "16px",
          cursor: newMessage.trim() ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0
        }}>
          ➤
        </button>
      </div>
    </div>
  );
}

export default PrivateChat;
