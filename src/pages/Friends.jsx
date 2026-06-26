// code's purpose: community tab friend requests + friends list

import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import MemberProfile from "../components/MemberProfile";
import TabBar from "../components/TabBar";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedUid, setSelectedUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const me = auth.currentUser?.uid;

  useEffect(() => {
    const fetch = async () => {
      const friendSnaps = await getDocs(collection(db, "friends"));
      const myFriendUids = friendSnaps.docs.filter(d => d.id.startsWith(`${me}_`)).map(d => d.data().uid);
      const fp = await Promise.all(myFriendUids.map(uid => getDoc(doc(db, "users", uid))));
      setFriends(fp.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));

      const reqSnaps = await getDocs(collection(db, "friendRequests"));
      const incomingUids = reqSnaps.docs.filter(d => d.data().toUid === me && d.data().status === "pending").map(d => d.data().fromUid);
      const rp = await Promise.all(incomingUids.map(uid => getDoc(doc(db, "users", uid))));
      setRequests(rp.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <div className="loader" />
    </div>
  );

  return (
    <div className="page">
      <div className="header">
        <span className="header-title">Community</span>
      </div>

      {requests.length > 0 && (
        <>
          <p className="section-label">Friend Requests ({requests.length})</p>
          {requests.map((r, i) => (
            <div key={r.id}>
              <div className="list-row" onClick={() => setSelectedUid(r.id)}>
                <img src={r.photoURL} alt={r.username} className="avatar" style={{ width: "48px", height: "48px", flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: "600", fontSize: "15px", margin: "0 0 2px" }}>{r.username}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>{r.major}</p>
                </div>
                <button className="text-btn">Accept</button>
              </div>
              {i < requests.length - 1 && <div className="divider" />}
            </div>
          ))}
          <div className="divider" style={{ margin: "8px 0" }} />
        </>
      )}

      <p className="section-label">Discover other members</p>

      {friends.length === 0 ? (
        <div className="empty-state" style={{ padding: "40px 32px" }}>
          <p style={{ fontSize: "14px" }}>Add friends from group chats to see them here.</p>
        </div>
      ) : (
        friends.map((f, i) => (
          <div key={f.id}>
            <div className="list-row">
              <img src={f.photoURL} alt={f.username} className="avatar"
                style={{ width: "48px", height: "48px", flexShrink: 0, cursor: "pointer" }}
                onClick={() => setSelectedUid(f.id)} />
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setSelectedUid(f.id)}>
                <p style={{ fontWeight: "600", fontSize: "15px", margin: "0 0 2px", cursor: "pointer" }}>{f.username}</p>
                <p style={{ fontSize: "13px", color: "var(--purple-dark)", margin: 0 }}>{f.telegram}</p>
              </div>
              <button onClick={() => navigate(`/private-chat/${f.id}`)} style={{
                background: "var(--input-bg)", border: "1px solid var(--border)",
                borderRadius: "8px", padding: "6px 14px", fontSize: "13px",
                fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif",
                color: "var(--text)"
              }}>
                Message
              </button>
            </div>
            {i < friends.length - 1 && <div className="divider" />}
          </div>
        ))
      )}

      <TabBar />
      {selectedUid && <MemberProfile uid={selectedUid} onClose={() => setSelectedUid(null)} />}
    </div>
  );
}
