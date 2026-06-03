import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

function AdminControls({ group, members, onClose }) {
  const [transferTo, setTransferTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const me = auth.currentUser?.uid;
  const isAdmin = group.adminId === me;

  if (!isAdmin) return null;

  const otherMembers = members.filter(m => m.uid !== me);

  const handleTransfer = async () => {
    if (!transferTo) { alert("Select a member!"); return; }
    setLoading(true);
    await updateDoc(doc(db, "groups", group.id), { adminId: transferTo });
    setMessage("✅ Admin rights transferred!");
    setLoading(false);
    setTimeout(onClose, 1500);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0",
        padding: "24px", width: "100%", maxWidth: "480px", paddingBottom: "40px"
      }}>
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 20px" }} />
        <h3 style={{ margin: "0 0 4px", color: "#1a1a1a", fontSize: "18px" }}>Admin Controls</h3>
        <p style={{ margin: "0 0 20px", color: "#888", fontSize: "13px" }}>You are the admin of this group</p>

        {message ? (
          <p style={{ textAlign: "center", color: "#4F46E5", fontWeight: "bold" }}>{message}</p>
        ) : (
          <>
            <p style={{ fontWeight: "bold", fontSize: "14px", color: "#1a1a1a", marginBottom: "10px" }}>
              Transfer admin rights to:
            </p>
            {otherMembers.length === 0 ? (
              <p style={{ color: "#aaa", fontSize: "14px" }}>No other members in this group yet.</p>
            ) : (
              otherMembers.map(m => (
                <div key={m.uid} onClick={() => setTransferTo(m.uid)} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px", borderRadius: "12px", marginBottom: "8px",
                  border: transferTo === m.uid ? "2px solid #4F46E5" : "1.5px solid #e0e0e0",
                  background: transferTo === m.uid ? "#f5f5ff" : "white",
                  cursor: "pointer"
                }}>
                  <img src={m.photoURL} style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
                  <p style={{ margin: 0, fontWeight: "bold", color: "#1a1a1a" }}>{m.username}</p>
                </div>
              ))
            )}
            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "12px", background: "white",
                color: "#4F46E5", border: "2px solid #4F46E5",
                borderRadius: "12px", cursor: "pointer", fontSize: "15px", fontWeight: "bold"
              }}>Cancel</button>
              <button onClick={handleTransfer} disabled={loading || !transferTo} style={{
                flex: 1, padding: "12px", background: transferTo ? "#4F46E5" : "#e0e0e0",
                color: "white", border: "none", borderRadius: "12px",
                cursor: transferTo ? "pointer" : "default", fontSize: "15px", fontWeight: "bold"
              }}>
                {loading ? "Transferring..." : "Transfer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminControls;
