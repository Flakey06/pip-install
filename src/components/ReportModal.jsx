import { useState } from "react";
import { auth, db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

const REASONS = [
  "Inappropriate language",
  "Harassment or bullying",
  "Spam or scam",
  "Offensive content",
  "Impersonation",
  "Other"
];

function ReportModal({ reportedUid, reportedName, groupId, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) { alert("Please select a reason!"); return; }
    setLoading(true);
    await addDoc(collection(db, "reports"), {
      reportedUid,
      reportedName,
      reporterUid: auth.currentUser.uid,
      groupId,
      reason,
      details,
      createdAt: serverTimestamp(),
      status: "pending"
    });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 400,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "24px 24px 0 0",
        padding: "24px", width: "100%", maxWidth: "480px",
        paddingBottom: "40px", maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ width: "40px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 20px" }} />

        {submitted ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
            <h3 style={{ color: "#1a1a1a", marginBottom: "8px" }}>Report submitted</h3>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "20px" }}>
              Thank you for keeping pip install safe. We'll review this shortly.
            </p>
            <button onClick={onClose} style={{
              width: "100%", padding: "14px", background: "#4F46E5",
              color: "white", border: "none", borderRadius: "12px",
              cursor: "pointer", fontSize: "16px", fontWeight: "bold"
            }}>Done</button>
          </div>
        ) : (
          <>
            <h3 style={{ margin: "0 0 4px", color: "#1a1a1a", fontSize: "18px" }}>
              Report {reportedName}
            </h3>
            <p style={{ margin: "0 0 20px", color: "#888", fontSize: "13px" }}>
              Reports are anonymous. We take all reports seriously.
            </p>

            <p style={{ fontWeight: "bold", fontSize: "14px", color: "#1a1a1a", marginBottom: "10px" }}>Reason *</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)} style={{
                  padding: "12px 14px", borderRadius: "10px",
                  border: reason === r ? "2px solid #4F46E5" : "1.5px solid #e0e0e0",
                  background: reason === r ? "#f5f5ff" : "white",
                  color: reason === r ? "#4F46E5" : "#1a1a1a",
                  cursor: "pointer", fontSize: "14px", textAlign: "left",
                  fontWeight: reason === r ? "bold" : "normal"
                }}>{r}</button>
              ))}
            </div>

            <p style={{ fontWeight: "bold", fontSize: "14px", color: "#1a1a1a", marginBottom: "8px" }}>
              Additional details (optional)
            </p>
            <textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Describe what happened..."
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                border: "1.5px solid #e0e0e0", fontSize: "14px",
                outline: "none", resize: "none", height: "80px",
                boxSizing: "border-box", marginBottom: "16px",
                fontFamily: "inherit", color: "#1a1a1a"
              }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={onClose} style={{
                flex: 1, padding: "12px", background: "white",
                color: "#4F46E5", border: "2px solid #4F46E5",
                borderRadius: "12px", cursor: "pointer",
                fontSize: "15px", fontWeight: "bold"
              }}>Cancel</button>
              <button onClick={handleSubmit} disabled={loading} style={{
                flex: 1, padding: "12px", background: "#ef4444",
                color: "white", border: "none", borderRadius: "12px",
                cursor: "pointer", fontSize: "15px", fontWeight: "bold"
              }}>{loading ? "Submitting..." : "Submit Report"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
