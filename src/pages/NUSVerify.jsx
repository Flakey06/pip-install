// file use: NUS student verification via @u.nus.edu email with 6-digit code
import { useState } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_s54glms";
const EMAILJS_TEMPLATE_ID = "template_j32ybel";
const EMAILJS_PUBLIC_KEY = "hBS-5QdhtoGwX6XaW";

export default function NUSVerify() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isNUSEmail = (e) => e.toLowerCase().trim().endsWith("@u.nus.edu");
  const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handleSend = async () => {
    if (!isNUSEmail(email)) {
      setError("Please enter a valid @u.nus.edu email address!");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const verifyCode = generateCode();
      const uid = auth.currentUser?.uid;

      // Save code to Firestore
      await setDoc(doc(db, "nusVerifyCodes", uid), {
        code: verifyCode,
        email: email.trim().toLowerCase(),
        createdAt: new Date(),
        used: false
      });

      // Send via EmailJS — to_email must match template variable
      const result = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email.trim().toLowerCase(),
          to_name: auth.currentUser?.displayName || "NUS Student",
          verify_code: verifyCode,
          from_name: "pip install"
        },
        EMAILJS_PUBLIC_KEY
      );

      console.log("EmailJS result:", result);
      setSent(true);
    } catch (err) {
      console.error("EmailJS error:", err);
      setError("Failed to send email: " + (err?.text || err?.message || "Unknown error"));
    }
    setSaving(false);
  };

  const handleVerify = async () => {
    if (enteredCode.trim().length !== 6) {
      setError("Please enter the 6-digit code!");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const uid = auth.currentUser?.uid;
      const snap = await getDoc(doc(db, "nusVerifyCodes", uid));

      if (!snap.exists()) {
        setError("Code not found. Please request a new one.");
        setVerifying(false);
        return;
      }

      const data = snap.data();
      console.log("Stored code:", data.code, "Entered code:", enteredCode.trim());

      // Check expiry (15 mins)
      const codeAge = (new Date() - data.createdAt.toDate()) / 1000 / 60;
      if (codeAge > 15) {
        setError("Code expired. Please request a new one.");
        setVerifying(false);
        return;
      }

      if (data.used) {
        setError("Code already used. Please request a new one.");
        setVerifying(false);
        return;
      }

      if (data.code !== enteredCode.trim()) {
        setError("Wrong code! Please check your email and try again.");
        setVerifying(false);
        return;
      }

      // Mark code as used
      await updateDoc(doc(db, "nusVerifyCodes", uid), { used: true });

      // Award NUS badge
      await updateDoc(doc(db, "users", uid), {
        nusVerified: true,
        nusEmail: email.trim().toLowerCase(),
        nusVerifiedAt: new Date()
      });

      setDone(true);
    } catch (err) {
      console.error("Verify error:", err);
      setError("Verification failed: " + err.message);
    }
    setVerifying(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">NUS Verification</span>
        <div style={{ width: "20px" }} />
      </div>

      <div style={{ flex: 1, padding: "32px 24px", maxWidth: "420px", margin: "0 auto", width: "100%" }}>

        {/* Done */}
        {done && (
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "64px", margin: "0 0 16px" }}>🎓</p>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              NUS Verified! ✅
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 24px", fontFamily: "Inter, sans-serif", lineHeight: "1.6" }}>
              Your NUS verified badge is now on your profile!
            </p>
            <div style={{ padding: "14px", borderRadius: "12px", background: "#dbeafe", border: "1px solid #93c5fd", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "28px" }}>
              <span style={{ fontSize: "22px" }}>✅</span>
              <p style={{ fontWeight: "700", color: "#1d4ed8", margin: 0, fontFamily: "Inter, sans-serif" }}>NUS Verified Student</p>
            </div>
            <button className="btn-primary" onClick={() => navigate("/home")} style={{ fontSize: "15px" }}>
              Back to Profile 🎉
            </button>
          </div>
        )}

        {/* Step 1: Enter email */}
        {!done && !sent && (
          <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--purple-light)", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", border: `2px solid var(--border)` }}>
                🎓
              </div>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                Verify as NUS Student
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif", lineHeight: "1.6" }}>
                Enter your NUS email — we'll send a 6-digit code to verify you're a student.
              </p>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: "14px", background: "var(--purple-light)", border: `1px solid var(--border)`, marginBottom: "24px" }}>
              {["✅ NUS Verified badge on your profile", "✅ Shown in group chats and search", "✅ More trust from other members"].map(item => (
                <p key={item} style={{ fontSize: "13px", color: "var(--purple-dark)", margin: "3px 0", fontFamily: "Inter, sans-serif" }}>{item}</p>
              ))}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="input-label">NUS Email Address</label>
              <input
                className="input-underline"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                placeholder="yourname@u.nus.edu"
                style={{ fontSize: "16px", paddingBottom: "10px" }}
                onKeyDown={e => e.key === "Enter" && handleSend()}
              />
              {email && !isNUSEmail(email) && (
                <p style={{ fontSize: "12px", color: "#ed4956", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>Must end with @u.nus.edu</p>
              )}
              {email && isNUSEmail(email) && (
                <p style={{ fontSize: "12px", color: "#15803d", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>✓ Valid NUS email</p>
              )}
            </div>

            {error && <p style={{ fontSize: "13px", color: "#ed4956", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>⚠️ {error}</p>}

            <button className="btn-primary" onClick={handleSend} disabled={saving || !isNUSEmail(email)} style={{ fontSize: "15px", padding: "14px" }}>
              {saving ? "Sending..." : "Send Verification Code →"}
            </button>
          </>
        )}

        {/* Step 2: Enter code */}
        {!done && sent && (
          <>
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <p style={{ fontSize: "48px", margin: "0 0 12px" }}>📬</p>
              <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                Check your NUS email
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>
                We sent a 6-digit code to:
              </p>
              <p style={{ fontWeight: "700", color: "var(--purple-dark)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {email}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="input-label">Enter 6-Digit Code</label>
              <input
                className="input-underline"
                type="text"
                inputMode="numeric"
                value={enteredCode}
                onChange={e => { setEnteredCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="000000"
                maxLength={6}
                autoFocus
                style={{ fontSize: "32px", letterSpacing: "8px", textAlign: "center", paddingBottom: "10px" }}
                onKeyDown={e => e.key === "Enter" && enteredCode.length === 6 && handleVerify()}
              />
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
                Code expires in 15 minutes · Check spam folder too
              </p>
            </div>

            {error && <p style={{ fontSize: "13px", color: "#ed4956", marginBottom: "14px", fontFamily: "Inter, sans-serif", textAlign: "center" }}>⚠️ {error}</p>}

            <button className="btn-primary" onClick={handleVerify} disabled={verifying || enteredCode.length !== 6} style={{ fontSize: "15px", padding: "14px", marginBottom: "10px" }}>
              {verifying ? "Verifying..." : "Verify ✅"}
            </button>

            <button onClick={() => { setSent(false); setEnteredCode(""); setError(""); }} className="btn-secondary" style={{ fontSize: "14px" }}>
              ← Try different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
