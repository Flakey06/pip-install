import { useState, useEffect, useRef } from "react";
import { auth, db, rtdb } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { ref, push, onValue, serverTimestamp } from "firebase/database";
import { useNavigate, useParams } from "react-router-dom";
import MemberProfile from "../components/MemberProfile";
import VideoCall from "../components/VideoCall";
import MiniGame from "../components/MiniGame";
import { generateTopic } from "../utils/topicGenerator";
import { markGroupAsRead } from "../hooks/useUnreadMessages";
import { leaveGroup } from "../hooks/useGroups";

export default function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [groupData, setGroupData] = useState(null);
  const [members, setMembers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [topic, setTopic] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  //Fetch current user profile
  useEffect(() => {
    const fetch = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setProfile(snap.data());
    };
    fetch();
  }, []);

  //Get group data and members
  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "groups", groupId));
      if (!snap.exists()) return;
      const data = snap.data();
      setGroupData(data);
      const memberProfiles = await Promise.all(
        data.members.map(uid => getDoc(doc(db, "users", uid)))
      );
      setMembers(memberProfiles.filter(m => m.exists()).map(m => ({ uid: m.id, ...m.data() })));
    };
    fetch();
  }, [groupId]);

  //Topic generator
  useEffect(() => {
    if (!groupData) return;
    setTopic(generateTopic(groupData.sharedInterests || []));
    const interval = setInterval(() => {
      setTopic(generateTopic(groupData.sharedInterests || []));
    }, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [groupData]);

  //listen to messages and filter history for new members
  useEffect(() => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    const unsubscribe = onValue(messagesRef, async (snap) => {
      const data = snap.val();
      if (!data) { setMessages([]); return; }
      let parsed = Object.entries(data)
        .map(([id, msg]) => ({ id, ...msg }))
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      // Filter history for new members if admin disabled it
      const uid = auth.currentUser?.uid;
      const groupSnap = await getDoc(doc(db, "groups", groupId));
      if (groupSnap.exists()) {
        const gData = groupSnap.data();
        if (!gData.historyForAll && uid !== gData.adminId) {
          const joinedAt = gData.memberJoinedAt?.[uid] || 0;
          if (joinedAt) {
            parsed = parsed.filter(m =>
              (m.timestamp || 0) >= joinedAt ||
              m.senderId === uid ||
              m.type === "system"
            );
          }
        }
      }

      setMessages(parsed);
      markGroupAsRead(groupId);
    });
    return () => unsubscribe();
  }, [groupId]);

  //Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const user = auth.currentUser;
    if (!user) return;
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    await push(messagesRef, {
      text: newMessage.trim(),
      senderId: user.uid,
      senderName: profile?.username || "Anonymous",
      senderPhoto: profile?.photoURL || user.photoURL || "",
      timestamp: serverTimestamp()
    });
    setNewMessage("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVideoCall = async () => {
    const messagesRef = ref(rtdb, `chats/${groupId}/messages`);
    await push(messagesRef, {
      text: `${profile?.username} started a video call 📹 — join at meet.jit.si/pip-install-${groupId}`,
      senderId: "system", senderName: "system", senderPhoto: "",
      timestamp: Date.now(), type: "system"
    });
    setShowVideoCall(true);
  };

  const isMe = (senderId) => senderId === auth.currentUser?.uid;

  const formatTime = (ts) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{
      height: "100vh", display: "flex", flexDirection: "column",
      background: "white", maxWidth: "480px", margin: "0 auto"
    }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: "10px 16px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex", alignItems: "center", gap: "10px",
        background: "white", flexShrink: 0
      }}>
        {/* Back */}
        <button onClick={() => navigate("/groups")} style={{
          background: "none", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", flexShrink: 0
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        {/* Group photo + name — tap to go to GroupInfo */}
        <div onClick={() => navigate(`/group-info/${groupId}`)} style={{
          display: "flex", alignItems: "center", gap: "10px",
          flex: 1, minWidth: 0, cursor: "pointer"
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "#f0f0f0", border: "1px solid #e0e0e0",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", flexShrink: 0, overflow: "hidden"
          }}>
            {groupData?.photoURL
              ? <img src={groupData.photoURL} alt="group" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "💬"
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{
              margin: 0, fontWeight: "700", fontSize: "15px", color: "#0f0f0f",
              fontFamily: "Inter, sans-serif",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
            }}>
              {groupData?.name || "Group Chat"}
            </p>
            <p style={{ margin: 0, fontSize: "11px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>
              {members.length} members · tap for info
            </p>
          </div>
        </div>

        {/* Overlapping member avatars */}
        <div style={{ display: "flex", flexShrink: 0 }}>
          {members.slice(0, 3).map((m, i) => (
            <img key={m.uid} src={m.photoURL}
              alt={m.username}
              onClick={() => setSelectedMember(m.uid)}
              style={{
                width: "26px", height: "26px", borderRadius: "50%",
                border: "2px solid white", marginLeft: i === 0 ? 0 : "-8px",
                objectFit: "cover", cursor: "pointer", flexShrink: 0
              }}
            />
          ))}
          {members.length > 3 && (
            <div style={{
              width: "26px", height: "26px", borderRadius: "50%",
              background: "#f0f0f0", fontSize: "10px", fontWeight: "700",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginLeft: "-8px", border: "2px solid white",
              color: "#0f0f0f", fontFamily: "Inter, sans-serif", flexShrink: 0
            }}>
              +{members.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* ── COMMON INTERESTS ── */}
      {groupData?.sharedInterests?.length > 0 && (
        <div style={{
          padding: "6px 16px", background: "#fafafa",
          borderBottom: "1px solid #f0f0f0",
          display: "flex", gap: "6px", flexWrap: "wrap",
          alignItems: "center", flexShrink: 0
        }}>
          <span style={{ fontSize: "11px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>Common:</span>
          {groupData.sharedInterests.map(i => (
            <span key={i} style={{
              padding: "2px 8px", borderRadius: "20px",
              background: "#0f0f0f", color: "white",
              fontSize: "11px", fontFamily: "Inter, sans-serif", fontWeight: "500"
            }}>
              {i}
            </span>
          ))}
        </div>
      )}

      {/* ── TOPIC ── */}
      {topic && (
        <div style={{
          padding: "8px 16px", background: "white",
          borderBottom: "1px solid #f0f0f0", flexShrink: 0
        }}>
          <div style={{
            background: "#fafafa", borderRadius: "10px",
            padding: "8px 12px", border: "1px solid #f0f0f0",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: "700", color: "#8e8e8e", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Topic
              </p>
              <p style={{ margin: 0, fontSize: "13px", color: "#0f0f0f", fontFamily: "Inter, sans-serif", lineHeight: "1.4" }}>
                {topic}
              </p>
            </div>
            <button onClick={() => setTopic(generateTopic(groupData?.sharedInterests || []))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#8e8e8e", fontSize: "16px", padding: "0 0 0 8px" }}>
              ↺
            </button>
          </div>
        </div>
      )}

      {/* ── MESSAGES ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "12px 16px",
        display: "flex", flexDirection: "column", gap: "1px"
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#8e8e8e", marginTop: "60px" }}>
            <p style={{ fontSize: "32px", marginBottom: "8px" }}>👋</p>
            <p style={{ fontSize: "14px", fontFamily: "Inter, sans-serif" }}>Say hi to your group!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const prev = messages[idx - 1];
          const next = messages[idx + 1];
          const isFirst = !prev || prev.senderId !== msg.senderId || prev.type === "system";
          const isLast = !next || next.senderId !== msg.senderId || next.type === "system";
          const mine = isMe(msg.senderId);

          if (msg.type === "system") {
            return (
              <div key={msg.id} style={{ textAlign: "center", margin: "10px 0" }}>
                <span style={{
                  fontSize: "12px", color: "#8e8e8e",
                  background: "#f5f5f5", padding: "4px 12px",
                  borderRadius: "20px", fontFamily: "Inter, sans-serif"
                }}>
                  {msg.text}
                </span>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{
              display: "flex",
              flexDirection: mine ? "row-reverse" : "row",
              alignItems: "flex-end", gap: "6px",
              marginTop: isFirst ? "10px" : "1px"
            }}>
              {/* Avatar */}
              {!mine && (
                <div style={{ width: "28px", flexShrink: 0, marginBottom: "2px" }}>
                  {isLast ? (
                    <img
                      src={msg.senderPhoto || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${msg.senderName}`}
                      alt={msg.senderName}
                      onClick={() => {
                        const m = members.find(m => m.uid === msg.senderId);
                        if (m) setSelectedMember(m.uid);
                      }}
                      style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                    />
                  ) : <div style={{ width: "28px" }} />}
                </div>
              )}

              <div style={{ maxWidth: "68%", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                {/* Sender name */}
                {!mine && isFirst && (
                  <p style={{ margin: "0 0 3px 4px", fontSize: "11px", fontWeight: "600", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>
                    {msg.senderName}
                  </p>
                )}

                {/* Bubble */}
                <div style={{
                  padding: "9px 13px",
                  borderRadius: mine
                    ? `18px 18px ${isLast ? "4px" : "18px"} 18px`
                    : `18px 18px 18px ${isLast ? "4px" : "18px"}`,
                  background: mine ? "#0f0f0f" : "#f0f0f0",
                  color: mine ? "white" : "#0f0f0f",
                  fontSize: "14px", lineHeight: "1.45",
                  wordBreak: "break-word",
                  fontFamily: "Inter, sans-serif"
                }}>
                  {msg.text}
                </div>

                {/* Timestamp */}
                {isLast && (
                  <p style={{ margin: "2px 4px 0", fontSize: "10px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>
                    {formatTime(msg.timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── MODERN INPUT BAR ── */}
      <div style={{
        padding: "10px 16px 28px",
        borderTop: "1px solid #f0f0f0",
        background: "white", flexShrink: 0,
        display: "flex", alignItems: "flex-end", gap: "10px"
      }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-end",
          background: "#f5f5f5", borderRadius: "22px",
          padding: "10px 16px",
          border: "1px solid #ebebeb", minHeight: "44px"
        }}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={e => {
              setNewMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              outline: "none", resize: "none", fontSize: "15px",
              fontFamily: "Inter, sans-serif", color: "#0f0f0f",
              lineHeight: "1.4", maxHeight: "120px",
              overflowY: "auto", padding: 0
            }}
          />
        </div>

        <button onClick={sendMessage} disabled={!newMessage.trim()} style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: newMessage.trim() ? "#0f0f0f" : "#f0f0f0",
          border: "none", cursor: newMessage.trim() ? "pointer" : "default",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.15s ease"
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill={newMessage.trim() ? "white" : "#8e8e8e"}>
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* ── MODALS ── */}
      {selectedMember && <MemberProfile uid={selectedMember} onClose={() => setSelectedMember(null)} />}
      {showVideoCall && <VideoCall groupId={groupId} groupName={groupData?.name} onClose={() => setShowVideoCall(false)} />}
      {showGame && <MiniGame groupId={groupId} groupName={groupData?.name} members={members} onClose={() => setShowGame(false)} />}
    </div>
  );
}
