import VideoCall from "../components/VideoCall";
import MiniGame from "../components/MiniGame";
import { useState, useEffect, useRef } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";
import MemberProfile from "../components/MemberProfile";
import AdminControls from "../components/AdminControls";
import { generateTopic } from "../utils/topicGenerator";
import { markGroupAsRead } from "../hooks/useUnreadMessages";
import { leaveGroup } from "../hooks/useGroups";

function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showGame, setShowGame] = useState(false);

  const [topic, setTopic] = useState("");
  const [topicTime, setTopicTime] = useState(null);

  const messagesEndRef = useRef(null);

  /* ---------------- PROFILE ---------------- */
  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfile(snap.data());
    };

    fetchProfile();
  }, []);

  /* ---------------- GROUP DATA ---------------- */
  useEffect(() => {
    const fetchGroup = async () => {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (!snap.exists()) return;

      const data = snap.data();
      setGroupData(data);

      const memberProfiles = await Promise.all(
        data.members.map(uid => getDoc(doc(db, "users", uid)))
      );

      setMembers(
        memberProfiles
          .filter(m => m.exists())
          .map(m => ({ uid: m.id, ...m.data() }))
      );
    };

    fetchGroup();
  }, [groupId]);

  /* ---------------- TOPIC GENERATOR ---------------- */
  useEffect(() => {
    if (!groupData) return;

    const generateNewTopic = () => {
      setTopic(generateTopic(groupData.sharedInterests || []));
      setTopicTime(new Date());
    };

    generateNewTopic();
    const interval = setInterval(generateNewTopic, 2 * 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [groupData]);

  /* ---------------- MESSAGES ---------------- */
  useEffect(() => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        setMessages([]);
        return;
      }

      const parsed = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      setMessages(parsed);
      markGroupAsRead(groupId);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---------------- LEAVE GROUP ---------------- */
  const handleLeaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;

    try {
      const messagesRef = ref(rtdb, `chats/${groupId}/messages`);

      await push(messagesRef, {
        text: `${profile?.username || "Someone"} has left the group 👋`,
        senderId: "system",
        senderName: "system",
        senderPhoto: "",
        timestamp: Date.now(),
        type: "system"
      });

      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(err);
    }

    await leaveGroup(groupId);
    navigate("/groups");
  };

  /* ---------------- SEND MESSAGE ---------------- */
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const user = auth.currentUser;
    if (!user) return;

    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);

    await push(messagesRef, {
      text: newMessage.trim(),
      senderId: user.uid,
      senderName: profile?.username || "Anonymous",
      senderPhoto: user.photoURL || "",
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

  /* ---------------- VIDEO CALL ---------------- */
  const startVideoCall = async () => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);

    await push(messagesRef, {
      text: `${profile?.username || "Someone"} started a video call 📹 — join at meet.jit.si/pip-install-${groupId}`,
      senderId: "system",
      senderName: "system",
      senderPhoto: "",
      timestamp: Date.now(),
      type: "system"
    });

    setShowVideoCall(true);
  };

  const isMe = (senderId) => senderId === auth.currentUser?.uid;
  const isAdmin = groupData?.adminId === auth.currentUser?.uid;

  /* ---------------- UI ---------------- */
  return (
    <div style={{
      height: "100vh",
      background: "white",
      display: "flex",
      flexDirection: "column",
      maxWidth: "480px",
      margin: "0 auto",
      overflow: "hidden"
    }}>

      {/* HEADER */}
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }}>
        <button onClick={() => navigate("/groups")} style={{
          background: "none",
          border: "none",
          fontSize: "22px",
          cursor: "pointer"
        }}>
          ←
        </button>

        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: "16px" }}>
            {groupData?.name || "Group Chat"}
          </h3>
          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
            {members.length}/6 members
          </p>
        </div>

        {/* VIDEO CALL BUTTON */}
        <button
          onClick={startVideoCall}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            padding: "4px"
          }}
          title="Start video call"
        >
          📹
        </button>

        {/* 🎮 MINI GAME BUTTON */}
        <button
          onClick={() => setShowGame(true)}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            flexShrink: 0,
            padding: "4px"
          }}
          title="Mini games"
        >
          🎮
        </button>

        {isAdmin && (
          <button onClick={() => setShowAdmin(true)} style={{ marginLeft: 6 }}>
            ⚙️
          </button>
        )}

        <button onClick={handleLeaveGroup} style={{ color: "red" }}>
          🚪
        </button>
      </div>

      {/* VIDEO CALL MODAL */}
      {showVideoCall && (
        <VideoCall
          groupId={groupId}
          groupName={groupData?.name}
          onClose={() => setShowVideoCall(false)}
        />
      )}

      {/* 🎮 MINI GAME MODAL */}
      {showGame && (
        <MiniGame
          groupId={groupId}
          groupName={groupData?.name}
          members={members}
          onClose={() => setShowGame(false)}
        />
      )}

      {/* MESSAGES */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {messages.map(msg => (
          msg.senderId === "system" ? (
            <div key={msg.id} style={{ textAlign: "center", margin: 8 }}>
              <span style={{
                fontSize: "12px",
                background: "#eee",
                padding: "4px 10px",
                borderRadius: 20
              }}>
                {msg.text}
              </span>
            </div>
          ) : (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: isMe(msg.senderId) ? "row-reverse" : "row",
              marginBottom: 10
            }}>
              <div style={{
                padding: "10px 14px",
                borderRadius: 18,
                background: isMe(msg.senderId) ? "#4F46E5" : "#f0f0f0",
                color: isMe(msg.senderId) ? "white" : "black"
              }}>
                {msg.text}
              </div>
            </div>
          )
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div style={{
        display: "flex",
        padding: 12,
        borderTop: "1px solid #eee"
      }}>
        <textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
          placeholder="Type message..."
        />
        <button onClick={sendMessage}>➤</button>
      </div>

      {/* MODALS */}
      {selectedMember && (
        <MemberProfile
          uid={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {showAdmin && (
        <AdminControls
          group={groupData}
          members={members}
          onClose={() => setShowAdmin(false)}
        />
      )}

    </div>
  );
}

export default GroupChat;