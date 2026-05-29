import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FAQS = [
  { question: "What is pip install?", answer: "pip install connects you with like-minded students based on your interests and personality!" },
  { question: "How does matching work?", answer: "We group you with 1-5 people who share similar interests, major, and personality traits." },
  { question: "Is it safe?", answer: "Yes! You can block or report any user who makes you uncomfortable." },
  { question: "Can I leave a group?", answer: "Absolutely! You can leave and join new groups anytime." }
];



/*
const login = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    const user = auth.currentUser;
    const docSnap = await getDoc(doc(db, "users", user.uid));
    if (docSnap.exists()) {
      navigate("/home");
    } else {
      navigate("/create-profile");
    }
  } catch (err) {
    console.error(err);
  }
};
*/

function Login() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      const user = auth.currentUser;
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        navigate("/home");
      } else {
        navigate("/create-profile");
      }
    } catch (err) {
      console.error(err);
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
      <div style={{ width: "100%", maxWidth: "420px", paddingTop: "60px", paddingBottom: "60px" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src="/pip-install_logo.png" alt="pip install" style={{ width: "300px" }} />
        </div>

        {/* Tagline */}
        <p style={{
          textAlign: "center",
          color: "#555",
          fontSize: "16px",
          marginBottom: "28px",
          lineHeight: "1.6"
        }}>
          Meet like-minded students, find teammates, and build friendships — all in one place.
        </p>

        {/* Feature cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
          {[
            { icon: "🤝", text: "Get matched with compatible people" },
            { icon: "💬", text: "Chat in small groups of 1–5" },
            { icon: "🎯", text: "Filter by interests & skills" },
            { icon: "🔒", text: "Safe — block & report anytime" },
          ].map((item, i) => (
            <div key={i} style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              background: "rgba(79, 70, 229, 0.08)",
              borderRadius: "12px",
              padding: "14px 16px",
              color: "#1a1a1a",
              fontSize: "15px"
            }}>
              <span style={{ fontSize: "22px" }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "16px",
            background: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "17px",
            fontWeight: "bold",
            marginBottom: "36px",
            boxShadow: "0 4px 12px rgba(79,70,229,0.3)"
          }}
        >
          🔑 Sign in with Google
        </button>

        {/* FAQ */}
        <h3 style={{ color: "#1a1a1a", marginBottom: "14px", fontSize: "18px" }}>FAQs</h3>
        {FAQS.map((faq, i) => (
          <div key={i} style={{
            background: "rgba(79, 70, 229, 0.06)",
            borderRadius: "12px",
            marginBottom: "10px",
            overflow: "hidden"
          }}>
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: "100%",
                padding: "14px 16px",
                background: "transparent",
                border: "none",
                color: "#1a1a1a",
                fontSize: "14px",
                fontWeight: "bold",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer"
              }}
            >
              {faq.question}
              <span style={{ color: "#4F46E5" }}>{openFaq === i ? "▲" : "▼"}</span>
            </button>
            {openFaq === i && (
              <div style={{
                padding: "0 16px 14px",
                color: "#555",
                fontSize: "13px",
                lineHeight: "1.6"
              }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Login;