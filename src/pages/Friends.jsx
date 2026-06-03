import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import MemberProfile from "../components/MemberProfile";

function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const me = auth.currentUser?.uid;

  useEffect(() => {
    const fetch = async () => {
      const friendSnaps = await getDocs(collection(db, "friends"));
      const myFriends = friendSnaps.docs
        .filter(d => d.id.startsWith(`${me}_`))
        .map(d => d.data().uid);

      const friendProfiles = await Promise.all(
        myFriends.map(uid => getDoc(doc(db, "users", uid)))
      );
      setFriends(friendProfiles.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));

      const reqSnaps = await getDocs(collection(db, "friendRequests"));
      const incoming = reqSnaps.docs
        .filter(d => d.data().toUid === me && d.data().status === "pending")
        .map(d => d.data().fromUid);

      const reqProfiles = await Promise.all(
        incoming.map(uid => getDoc(doc(db, "users", uid)))
      );
      setRequests(reqProfiles.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", marginTop: "100px", color: "#4F46E5" }}>Loading... ⏳</div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", justifyContent: "center", padding: "0 24px" }}>
      <div style={{ width: "100%", maxWidth: "420px", paddingTop: "60px", paddingBottom: "60px" }}>

        <div style={{ display: "flex", alignItems: "center", marginBottom: "28px" }}>
          <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>←</button>
          <h2 style={{ margin: "0 0 0 12px", color: "#1a1a1a", fontSize: "22px" }}>Friends 👥</h2>
        </div>

        {/* Incoming requests */}
        {requests.length > 0 && (
          <div style={{ marginBottom: "28px" }}>
            <p style={{ fontWeight: "bold", color: "#1a1a1a", marginBottom: "12px" }}>
              Friend Requests ({requests.length})
            </p>
            {requests.map(r => (
              <div key={r.id} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px", borderRadius: "12px",
                background: "#f5f5ff", marginBottom: "8px", cursor: "pointer"
              }} onClick={() => setSelectedUid(r.id)}>
                <img src={r.photoURL} style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1a1a1a" }}>{r.username}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{r.major}</p>
                </div>
                <span style={{ fontSize: "12px", color: "#4F46E5", fontWeight: "bold" }}>Tap to accept</span>
              </div>
            ))}
          </div>
        )}

        {/* Friends list */}
        <p style={{ fontWeight: "bold", color: "#1a1a1a", marginBottom: "12px" }}>
          My Friends ({friends.length})
        </p>
        {friends.length === 0 ? (
          <div style={{ textAlign: "center", color: "#aaa", marginTop: "40px" }}>
            <p style={{ fontSize: "32px" }}>👋</p>
            <p>No friends yet!</p>
            <p style={{ fontSize: "13px" }}>Click on group members to add them</p>
          </div>
        ) : (
          friends.map(f => (
            <div key={f.id} style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "12px", borderRadius: "12px",
              border: "1px solid #f0f0f0", marginBottom: "8px"
            }}>
              <img
                src={f.photoURL}
                style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                onClick={() => setSelectedUid(f.id)}
              />
              <div style={{ flex: 1 }} onClick={() => setSelectedUid(f.id)} >
                <p style={{ margin: 0, fontWeight: "bold", color: "#1a1a1a", cursor: "pointer" }}>{f.username}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#4F46E5" }}>{f.telegram}</p>
              </div>
              {/* Message button */}
              <button
                onClick={() => navigate(`/private-chat/${f.id}`)}
                style={{
                  padding: "8px 14px", background: "#4F46E5",
                  color: "white", border: "none", borderRadius: "10px",
                  cursor: "pointer", fontSize: "13px", fontWeight: "bold"
                }}
              >
                💬 Chat
              </button>
            </div>
          ))
        )}

        {selectedUid && (
          <MemberProfile uid={selectedUid} onClose={() => setSelectedUid(null)} />
        )}
      </div>
    </div>
  );
}

export default Friends;
