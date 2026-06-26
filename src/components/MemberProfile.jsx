// file use: Member profile modal, view profile, add friend, report user
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import ReportModal from "./ReportModal";

function MemberProfile({ uid, onClose }) {
  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none");
  const [loading, setLoading] = useState(true);
  const me = auth.currentUser.uid;
  const [showReport, setShowReport] = useState(false);
  

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());

      const friendSnap = await getDoc(doc(db, "friends", `${me}_${uid}`));
      if (friendSnap.exists()) { setFriendStatus("friends"); setLoading(false); return; }

      const reqSnap = await getDoc(doc(db, "friendRequests", `${me}_${uid}`));
      if (reqSnap.exists()) { setFriendStatus("sent"); setLoading(false); return; }

      const recSnap = await getDoc(doc(db, "friendRequests", `${uid}_${me}`));
      if (recSnap.exists()) { setFriendStatus("received"); setLoading(false); return; }

      setFriendStatus("none");
      setLoading(false);
    };
    fetch();
  }, [uid]);

  const sendRequest = async () => {
    await setDoc(doc(db, "friendRequests", `${me}_${uid}`), {
      fromUid: me, toUid: uid,
      status: "pending", createdAt: serverTimestamp()
    });
    setFriendStatus("sent");
  };

  const acceptRequest = async () => {
    await setDoc(doc(db, "friends", `${me}_${uid}`), { uid, addedAt: serverTimestamp() });
    await setDoc(doc(db, "friends", `${uid}_${me}`), { uid: me, addedAt: serverTimestamp() });
    await updateDoc(doc(db, "friendRequests", `${uid}_${me}`), { status: "accepted" });
    setFriendStatus("friends");
  };

  if (loading || !profile) return null;

  const isFriend = friendStatus === "friends";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.4)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div
        style={{
          background: "white", borderRadius: "24px 24px 0 0",
          padding: "28px 24px", width: "100%", maxWidth: "480px",
          paddingBottom: "40px"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 20px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <img
            src={profile.photoURL}
            alt={profile.username}
            style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid #4F46E5" }}
          />
          <div>
            <h3 style={{ margin: 0, color: "#1a1a1a", fontSize: "18px" }}>{profile.username}</h3>
            <p style={{ margin: "2px 0 0", color: "#888", fontSize: "13px" }}>{profile.major} · Year {profile.year}</p>
            {isFriend && profile.telegram && (
              <p style={{ margin: "4px 0 0", color: "#4F46E5", fontSize: "13px", fontWeight: "bold" }}>
                📱 {profile.telegram}
              </p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "16px", lineHeight: "1.5" }}>
            {profile.bio}
          </p>
        )}

        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontWeight: "bold", color: "#1a1a1a", fontSize: "13px", marginBottom: "8px" }}>Interests</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {profile.interests?.map(i => (
              <span key={i} style={{
                padding: "4px 12px", borderRadius: "20px",
                background: "#4F46E5", color: "white", fontSize: "12px"
              }}>
                {i}
              </span>
            ))}
          </div>
        </div>

        {!isFriend && profile.telegram && (
          <p style={{ fontSize: "12px", color: "#aaa", marginBottom: "16px" }}>
            🔒 Add as friend to see Telegram handle
          </p>
        )}

        {uid !== me && (
          <button
            onClick={
              friendStatus === "none" ? sendRequest :
              friendStatus === "received" ? acceptRequest : null
            }
            style={{
              width: "100%", padding: "14px",
              background: friendStatus === "friends" ? "#f0f0f0" :
                          friendStatus === "sent" ? "#f5f5ff" : "#4F46E5",
              color: friendStatus === "friends" ? "#888" :
                     friendStatus === "sent" ? "#4F46E5" : "white",
              border: friendStatus === "sent" ? "1.5px solid #4F46E5" : "none",
              borderRadius: "12px",
              cursor: friendStatus === "none" || friendStatus === "received" ? "pointer" : "default",
              fontSize: "15px", fontWeight: "bold"
            }}
          >
            {friendStatus === "none" && "Add Friend"}
            {friendStatus === "sent" && "Request Sent"}
            {friendStatus === "received" && "Accept Friend Request"}
            {friendStatus === "friends" && "Friends"}
          </button>

        )}

        {uid !== me && (
          <button
            onClick={() => setShowReport(true)}
            style={{
              width: "100%", padding: "12px",
              background: "white", color: "#ef4444",
              border: "1.5px solid #ef4444", borderRadius: "12px",
              cursor: "pointer", fontSize: "14px",
              fontWeight: "bold", marginTop: "10px"
            }}
          >
            🚩 Report User
          </button>
        )}

        {showReport && (
          <ReportModal
            reportedUid={uid}
            reportedName={profile?.username}
            groupId={null}
            onClose={() => setShowReport(false)}
          />
        )}
      </div>
    </div>
  );
}
export default MemberProfile;