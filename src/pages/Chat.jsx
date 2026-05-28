import { auth,db } from "../firebase";
import React, { useEffect, useRef, useState } from "react";
import {
  addDoc,
  query,
  collection,
  orderBy,
  onSnapshot,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";



function Chat() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubMessages = onSnapshot(q, (snapshot) => {
      const fetchedMessages = [];
      snapshot.forEach((doc) => {
        fetchedMessages.push({ ...doc.data(), id: doc.id });
      });

      const sortedMessages = fetchedMessages.sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() ?? 0;
        const bMs = b.createdAt?.toMillis?.() ?? 0;
        return aMs - bMs;
      });

      setMessages(sortedMessages);
    });

    return unsubMessages;
  }, []); 

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !auth.currentUser) return;

    try{
      const { uid, displayName, photoURL } = auth.currentUser;

      await addDoc(collection(db, "messages"), {
        text: message,
        name: displayName,
        avatar: photoURL,
        createdAt: serverTimestamp(),
        uid,
      });

      setMessage("");
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };
  

  return ( 
    <div style={{
      minHeight: "100vh",
      background: "white",
      display: "flex",
      justifyContent: "center",
      padding: "0 24px"
    }}>
      <div style={{ width: "100%", maxWidth: "900px", margin: "0 auto", paddingTop: "24px", paddingBottom: "24px" }}>

        {/* Group Name */}
        <div style={{ textAlign: "left", marginBottom: "28px",
          background: "#4f46e50f",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <h2 style={{ 
            color: "#4F46E5",
            fontSize: "24px",
            fontWeight: "bold",
            marginBottom: "4px" }}>
            Group Chat
          </h2>
        </div>

        {/* Chat Bubble */} 
        <div style={{ marginBottom: "90px" }}>
          {messages.map((m) => {
            const isUser = user && m.uid === user.uid;
            return (
              <div 
                key = {m.id}
                style = {{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  marginBottom: "14px",
                  marginLeft: isUser ? "auto" : "0",
                  maxWidth: "85%",
                  width: "max-content",
                  padding: "12px 14px",
                  borderRadius: isUser ? "16px 16px px 0 16px" : "16px 16px 16px 0",
                  background: isUser ? "#4f46e50f" : "#7cc5d9"
                }}
                >
                <div>
                  <p style = {{
                    margin:"0 0 4px",
                    fontWeight: "bold",
                    fontSize: "1.2rem",
                    color: "#4F46E5" }}>
                    {m.name}
                  </p>
                  <p style = {{ margin: 0, wordBreak: "break-word", textAlign:"left"}}>
                    {m.text}
                  </p>
                </div>
              </div>
            );
          })}

          <span ref = {scrollRef} />
          </div>

        {/* Send Message*/}
        <form
          onSubmit = {sendMessage}
          style = {{
            position: "fixed",
            left: 373,
            right: 373,
            bottom: 0,
            display: "flex",
            padding: "16px 24px",
            background: "#4c768d",
          }}radioGroup=""
        >
          <input
            type = "text"
            placeholder = "Type message here ..."
            value = {message}
            onChange = {(e) => setMessage(e.target.value)}
            style ={{
              flex: 1,
              height: "40px",
              border: "none",
              borderRadius: "6px 0 0 6px",
              padding: "0 10px",
              fontSize: "1rem",
            }}
            />
            <button
              type = "submit"

              style ={{
                width: "80px",
                border: "1px solid #7cc5d9",
                background: " #7cc5d9",
                borderRadius: "0 6px 6px 0",
                fontweight: 600,
              }}
              >
                Send
              </button>
            </form>
          </div>
        </div>
       );
      }

export default Chat;