// file use: handles the email link click, awards NUS verified badge
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc, runTransaction } from "firebase/firestore";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useNavigate } from "react-router-dom";

// Atomically claims the NUS email for this uid using a transaction on a doc
// keyed by the email itself, so two accounts can't both verify the same
// NUS email even if they complete this flow at nearly the same time.
async function claimNusEmail(email, uid) {
  const claimRef = doc(db, "nusEmailClaims", email);
  await runTransaction(db, async (transaction) => {
    const claimSnap = await transaction.get(claimRef);
    if (claimSnap.exists() && claimSnap.data().uid !== uid) {
      throw new Error("EMAIL_ALREADY_CLAIMED");
    }
    transaction.set(claimRef, { uid, claimedAt: new Date() });
  });
}

export default function NUSVerifyComplete() {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        if (!isSignInWithEmailLink(auth, window.location.href)) {
          setStatus("error");
          setError("Invalid verification link.");
          return;
        }

        let email = localStorage.getItem("nus_verify_email");
        if (!email) {
          email = window.prompt("Please enter your NUS email to confirm:");
        }

        if (!email || !email.endsWith("@u.nus.edu")) {
          setStatus("error");
          setError("Invalid email address.");
          return;
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Complete sign in with email link (this verifies the email)
        await signInWithEmailLink(auth, normalizedEmail, window.location.href);
        localStorage.removeItem("nus_verify_email");

        const user = auth.currentUser;
        if (!user) {
          setStatus("error");
          setError("Could not find your account. Please try again.");
          return;
        }

        // Enforce one NUS email per account before awarding the badge.
        try {
          await claimNusEmail(normalizedEmail, user.uid);
        } catch (claimErr) {
          if (claimErr.message === "EMAIL_ALREADY_CLAIMED") {
            setStatus("error");
            setError("This NUS email is already verified on another account.");
            return;
          }
          throw claimErr;
        }

        // Award NUS verified badge
        await updateDoc(doc(db, "users", user.uid), {
          nusVerified: true,
          nusEmail: normalizedEmail,
          nusVerifiedAt: new Date()
        });

        setStatus("success");
      } catch (err) {
        console.error(err);
        setStatus("error");
        setError(err.message || "Verification failed. Try again.");
      }
    };
    verify();
  }, []);

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px"
    }}>
      <div style={{ textAlign: "center", maxWidth: "340px" }}>
        {status === "loading" && (
          <>
            <div className="loader" style={{ margin: "0 auto 20px" }} />
            <p style={{ fontSize: "15px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>
              Verifying your NUS email...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <p style={{ fontSize: "64px", margin: "0 0 16px" }}>🎓</p>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              NUS Verified! ✅
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 24px", fontFamily: "Inter, sans-serif", lineHeight: "1.6" }}>
              Your profile now shows the NUS verified badge. Other members can trust you're a real NUS student!
            </p>
            <div style={{
              padding: "14px", borderRadius: "12px",
              background: "var(--purple-light)", marginBottom: "24px",
              border: `1px solid var(--border)`,
              display: "flex", alignItems: "center", gap: "10px", justifyContent: "center"
            }}>
              <span style={{ fontSize: "20px" }}>✅</span>
              <p style={{ fontWeight: "700", color: "var(--purple-dark)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                NUS Verified Student
              </p>
            </div>
            <button className="btn-primary" onClick={() => navigate("/home")} style={{ fontSize: "15px" }}>
              Back to Profile
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <p style={{ fontSize: "64px", margin: "0 0 16px" }}>❌</p>
            <h2 style={{ fontSize: "22px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
              Verification Failed
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 24px", fontFamily: "Inter, sans-serif" }}>
              {error}
            </p>
            <button className="btn-primary" onClick={() => navigate("/nus-verify")} style={{ fontSize: "15px" }}>
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}