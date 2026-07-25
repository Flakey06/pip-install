// file use: Member profile modal, view profile, add friend, block, report user
import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import ReportModal from "./ReportModal";
import { recordProfileView } from "../hooks/useProfileViews";
import { blockUser, unblockUser, isBlocked } from "../hooks/useBlock";

function MemberProfile({ uid, onClose }) {
  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none");
  const [blocked, setBlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const me = auth.currentUser?.uid;

  useEffect(() => {
    const fetch = async () => {
      // Record profile view
      await recordProfileView(uid);

      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());

      // Check friend status
      const friendSnap = await getDoc(doc(db, "friends", `${me}_${uid}`));
      if (friendSnap.exists()) { setFriendStatus("friends"); }
      else {
        const reqSnap = await getDoc(doc(db, "friendRequests", `${me}_${uid}`));
        if (reqSnap.exists()) { setFriendStatus("sent"); }
        else {
          const recSnap = await getDoc(doc(db, "friendRequests", `${uid}_${me}`));
          if (recSnap.exists()) { setFriendStatus("received"); }
          else { setFriendStatus("none"); }
        }
      }

      // Check block status
      const blockedStatus = await isBlocked(uid);
      setBlocked(blockedStatus);

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

  const handleBlock = async () => {
    if (blocked) {
      await unblockUser(uid);
      setBlocked(false);
    } else {
      await blockUser(uid);
      setBlocked(true);
    }
    setShowBlockConfirm(false);
  };

  if (loading || !profile) return null;

  const isFriend = friendStatus === "friends";

  const ringStyle = profile.profileRing === "rainbow_ring"
    ? "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff)"
    : profile.profileRing === "gold_ring"
    ? "linear-gradient(135deg, #f7c94b, #e6a817)"
    : profile.profileRing === "premium_ring"
    ? "linear-gradient(135deg, var(--purple), var(--purple-dark))"
    : null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.45)", zIndex: 200,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        padding: "20px 20px 40px", width: "100%", maxWidth: "480px"
      }}>
        <div style={{ width: "36px", height: "4px", background: "var(--border)", borderRadius: "2px", margin: "0 auto 20px" }} />

        {/* Profile header */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            {ringStyle && (
              <div style={{ position: "absolute", inset: "-3px", borderRadius: "50%", background: ringStyle, zIndex: 0 }} />
            )}
            <img src={profile.photoURL} alt={profile.username} style={{
              width: "60px", height: "60px", borderRadius: "50%",
              objectFit: "cover", position: "relative", zIndex: 1,
              border: ringStyle ? "3px solid var(--bg)" : `2px solid var(--border)`
            }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: "0 0 2px", color: "var(--text)", fontSize: "18px", fontFamily: "Inter, sans-serif", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}>

              {profile.username}
              {profile.nusVerified && (
                <span style={{
                  fontSize: "11px", background: "#1d4ed8", color: "white",
                  padding: "2px 7px", borderRadius: "5px",
                  fontFamily: "Inter, sans-serif", fontWeight: "700"
                }}>✅ NUS</span>
              )}
              {profile.profileBadge && (
                <span>{profile.profileBadge === "badge_star" ? "⭐" : profile.profileBadge === "badge_fire" ? "🔥" : "👑"}</span>
              )}
            </h3>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>
              {profile.major} · Year {profile.year}
            </p>
            {isFriend && profile.telegram && (
              <p style={{ margin: "4px 0 0", color: "var(--purple-dark)", fontSize: "13px", fontWeight: "600", fontFamily: "Inter, sans-serif" }}>
                📱 {profile.telegram}
              </p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "14px", lineHeight: "1.5", fontFamily: "Inter, sans-serif" }}>
            {profile.bio}
          </p>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <p style={{ fontWeight: "600", color: "var(--text)", fontSize: "12px", marginBottom: "8px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Interests
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {profile.interests.map(i => (
                <span key={i} style={{
                  padding: "4px 12px", borderRadius: "20px",
                  background: "var(--purple-light)", color: "var(--purple-dark)",
                  fontSize: "12px", fontFamily: "Inter, sans-serif", fontWeight: "500"
                }}>
                  {i}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Telegram locked */}
        {!isFriend && profile.telegram && (
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>
            🔒 Add as friend to see Telegram handle
          </p>
        )}

        {/* Action buttons */}
        {uid !== me && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Friend button */}
            <button onClick={
              friendStatus === "none" ? sendRequest :
              friendStatus === "received" ? acceptRequest : undefined
            } style={{
              width: "100%", padding: "13px",
              background: friendStatus === "friends" ? "var(--input-bg)"
                : friendStatus === "sent" ? "var(--purple-light)"
                : "var(--purple-dark)",
              color: friendStatus === "friends" ? "var(--text-muted)"
                : friendStatus === "sent" ? "var(--purple-dark)"
                : "var(--bg)",
              border: friendStatus === "sent" ? `1.5px solid var(--purple-dark)` : "none",
              borderRadius: "12px",
              cursor: friendStatus === "none" || friendStatus === "received" ? "pointer" : "default",
              fontSize: "15px", fontWeight: "600", fontFamily: "Inter, sans-serif"
            }}>
              {friendStatus === "none" && "➕ Add Friend"}
              {friendStatus === "sent" && "✓ Request Sent"}
              {friendStatus === "received" && "Accept Friend Request"}
              {friendStatus === "friends" && "✓ Friends"}
            </button>

            {/* Block button */}
            {!showBlockConfirm ? (
              <button onClick={() => setShowBlockConfirm(true)} style={{
                width: "100%", padding: "11px",
                background: "none",
                color: blocked ? "var(--text-muted)" : "#ed4956",
                border: `1px solid ${blocked ? "var(--border)" : "#ed4956"}`,
                borderRadius: "12px", cursor: "pointer",
                fontSize: "14px", fontWeight: "600",
                fontFamily: "Inter, sans-serif"
              }}>
                {blocked ? "🚫 Unblock User" : "🚫 Block User"}
              </button>
            ) : (
              <div style={{ padding: "12px", borderRadius: "12px", background: "var(--input-bg)", border: `1px solid var(--border)` }}>
                <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 10px", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
                  {blocked ? "Unblock this user?" : "Block this user? They won't be able to interact with you."}
                </p>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => setShowBlockConfirm(false)} style={{
                    flex: 1, padding: "10px", background: "var(--card)",
                    border: `1px solid var(--border)`, borderRadius: "8px",
                    fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "Inter, sans-serif", color: "var(--text)"
                  }}>Cancel</button>
                  <button onClick={handleBlock} style={{
                    flex: 1, padding: "10px",
                    background: blocked ? "var(--purple-dark)" : "#ed4956",
                    border: "none", borderRadius: "8px", color: "var(--bg)",
                    fontSize: "13px", fontWeight: "600", cursor: "pointer",
                    fontFamily: "Inter, sans-serif"
                  }}>
                    {blocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </div>
            )}

            {/* Report button */}
            <button onClick={() => setShowReport(true)} style={{
              width: "100%", padding: "11px",
              background: "none", color: "var(--text-muted)",
              border: `1px solid var(--border)`,
              borderRadius: "12px", cursor: "pointer",
              fontSize: "14px", fontFamily: "Inter, sans-serif"
            }}>
              🚩 Report User
            </button>
          </div>
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
