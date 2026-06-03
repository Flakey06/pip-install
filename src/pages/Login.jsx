import { auth, googleProvider, db } from "../firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FAQS = [
  { q: "What is pip install?", a: "pip install connects you with like-minded students based on shared interests — think of it as installing new people into your day." },
  { q: "How does matching work?", a: "We group you with 3-6 people who share similar interests. At least one common interest is required per group." },
  { q: "Is it safe?", a: "Yes! You can block or report any user. Telegram handles are only revealed to mutual friends." },
  { q: "Can I leave a group?", a: "Absolutely — leave anytime and join a new one based on your updated interests." }
];

export default function Login() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("choose"); // "choose" | "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const goToApp = async (user) => {
    const docSnap = await getDoc(doc(db, "users", user.uid));
    navigate(docSnap.exists() ? "/home" : "/create-profile");
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await goToApp(result.user);
    } catch (err) {
      setError("Google sign-in failed. Try again!");
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields!"); return; }
    setLoading(true); setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await goToApp(result.user);
    } catch (err) {
      if (err.code === "auth/user-not-found") setError("No account found. Sign up instead!");
      else if (err.code === "auth/wrong-password") setError("Wrong password. Try again!");
      else if (err.code === "auth/invalid-email") setError("Invalid email address!");
      else setError("Login failed. Try again!");
      setLoading(false);
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !confirmPassword) { setError("Please fill in all fields!"); return; }
    if (password !== confirmPassword) { setError("Passwords don't match!"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters!"); return; }
    setLoading(true); setError("");
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await goToApp(result.user);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("Email already registered. Log in instead!");
      else if (err.code === "auth/invalid-email") setError("Invalid email address!");
      else setError("Sign up failed. Try again!");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mesh-bg" />
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", padding: "0 24px" }}>
        <div style={{ width: "100%", maxWidth: "420px", paddingTop: "52px", paddingBottom: "80px" }}>

          {/* Logo */}
          <div className="fade-up" style={{ textAlign: "center", marginBottom: "32px" }}>
            <div style={{ display: "inline-block", animation: "float 4s ease-in-out infinite", filter: "drop-shadow(0 8px 24px var(--border))" }}>
              <img src="/pip-install_logo.png" alt="pip install" style={{ width: "180px" }} />
            </div>
            <div style={{ position: "relative", display: "inline-block", marginTop: "14px" }}>
              <p className="sketch-font" style={{ fontSize: "18px", color: "var(--purple-dark)" }}>
                installing new people into your day ✨
              </p>
              <svg style={{ position: "absolute", bottom: "-4px", left: 0, width: "100%", height: "6px" }} viewBox="0 0 200 6" preserveAspectRatio="none">
                <path d="M0 4 Q50 1 100 4 Q150 7 200 4" stroke="var(--purple-mid)" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* ── CHOOSE MODE ── */}
          {mode === "choose" && (
            <div className="fade-up-1">
              {/* Feature cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}>
                {[
                  { icon: "🤝", text: "Match with compatible people", rotate: "-0.4deg" },
                  { icon: "💬", text: "Chat in groups of 3–6", rotate: "0.4deg" },
                  { icon: "🎯", text: "Filter by interests & skills", rotate: "-0.3deg" },
                  { icon: "🔒", text: "Safe — block & report anytime", rotate: "0.3deg" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: "14px",
                    background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)",
                    borderRadius: "14px", padding: "13px 16px",
                    border: "1.5px solid var(--border-sketch)",
                    boxShadow: "3px 3px 0px var(--border)",
                    transform: `rotate(${item.rotate})`,
                    transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                    animation: `fadeUp 0.5s ${0.15 + i * 0.08}s ease both`
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "rotate(0deg) translateY(-2px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = `rotate(${item.rotate})`}
                  >
                    <span style={{ fontSize: "22px" }}>{item.icon}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text)" }}>{item.text}</span>
                  </div>
                ))}
              </div>

              {/* Auth buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "12px" }}>
                <button className="btn-primary" onClick={handleGoogle} disabled={loading}
                  style={{ fontSize: "15px" }}>
                  🔑 Continue with Google
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-sketch)" }} />
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600" }}>OR</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border-sketch)" }} />
                </div>

                <button className="btn-secondary" onClick={() => { setMode("login"); setError(""); }}
                  style={{ fontSize: "15px" }}>
                  📧 Log in with Email
                </button>

                <button onClick={() => { setMode("signup"); setError(""); }} style={{
                  background: "none", border: "none", color: "var(--purple-dark)",
                  fontSize: "14px", fontWeight: "600", cursor: "pointer",
                  textDecoration: "underline", textDecorationColor: "var(--border-sketch)",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "6px"
                }}>
                  New here? Create an account →
                </button>
              </div>
            </div>
          )}

          {/* ── EMAIL LOGIN ── */}
          {mode === "login" && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <button onClick={() => { setMode("choose"); setError(""); }} style={{
                  background: "none", border: "none", fontSize: "22px",
                  cursor: "pointer", color: "var(--text)"
                }}>←</button>
                <h2 className="display-font" style={{ fontSize: "22px", color: "var(--text)" }}>
                  Welcome back 👋
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>Email</label>
                  <input
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={e => e.key === "Enter" && handleEmailLogin()}
                      style={{ paddingRight: "48px" }}
                    />
                    <button onClick={() => setShowPass(!showPass)} style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "16px",
                      color: "var(--text-muted)"
                    }}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#DC2626", fontSize: "13px", fontWeight: "600",
                  marginBottom: "14px"
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button className="btn-primary" onClick={handleEmailLogin} disabled={loading}
                  style={{ fontSize: "15px" }}>
                  {loading ? "Logging in..." : "Log In →"}
                </button>
                <button onClick={() => { setMode("signup"); setError(""); }} style={{
                  background: "none", border: "none", color: "var(--purple-dark)",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  Don't have an account? Sign up →
                </button>
              </div>
            </div>
          )}

          {/* ── EMAIL SIGNUP ── */}
          {mode === "signup" && (
            <div className="fade-up">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
                <button onClick={() => { setMode("choose"); setError(""); }} style={{
                  background: "none", border: "none", fontSize: "22px",
                  cursor: "pointer", color: "var(--text)"
                }}>←</button>
                <h2 className="display-font" style={{ fontSize: "22px", color: "var(--text)" }}>
                  Create account 🚀
                </h2>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>Email</label>
                  <input
                    className="input-field"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      className="input-field"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="min 6 characters"
                      style={{ paddingRight: "48px" }}
                    />
                    <button onClick={() => setShowPass(!showPass)} style={{
                      position: "absolute", right: "14px", top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", fontSize: "16px",
                      color: "var(--text-muted)"
                    }}>
                      {showPass ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", display: "block", marginBottom: "6px" }}>Confirm Password</label>
                  <input
                    className="input-field"
                    type={showPass ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="repeat password"
                    onKeyDown={e => e.key === "Enter" && handleEmailSignup()}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: "10px",
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#DC2626", fontSize: "13px", fontWeight: "600",
                  marginBottom: "14px"
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button className="btn-primary" onClick={handleEmailSignup} disabled={loading}
                  style={{ fontSize: "15px" }}>
                  {loading ? "Creating account..." : "Create Account 🚀"}
                </button>
                <button onClick={() => { setMode("login"); setError(""); }} style={{
                  background: "none", border: "none", color: "var(--purple-dark)",
                  fontSize: "13px", fontWeight: "600", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif"
                }}>
                  Already have an account? Log in →
                </button>
              </div>
            </div>
          )}

          {/* FAQs — only show on choose screen */}
          {mode === "choose" && (
            <div className="fade-up-3" style={{ marginTop: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <p className="section-label" style={{ margin: 0 }}>FAQs</p>
                <div style={{ flex: 1, height: "1px", background: "var(--border-sketch)" }} />
              </div>
              {FAQS.map((faq, i) => (
                <div key={i} style={{
                  borderRadius: "14px", border: "1.5px solid var(--border-sketch)",
                  overflow: "hidden", background: "rgba(255,255,255,0.8)",
                  boxShadow: openFaq === i ? "3px 3px 0px var(--border-sketch)" : "2px 2px 0px var(--border)",
                  marginBottom: "8px", transition: "all 0.2s ease"
                }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{
                    width: "100%", padding: "13px 16px",
                    background: "transparent", border: "none",
                    color: "var(--text)", fontSize: "14px", fontWeight: "600",
                    textAlign: "left", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", gap: "8px"
                  }}>
                    <span>{faq.q}</span>
                    <span style={{
                      color: "var(--purple)", fontSize: "20px",
                      transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                      transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0, lineHeight: 1
                    }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{
                      padding: "0 16px 14px", color: "var(--text-muted)",
                      fontSize: "13px", lineHeight: "1.7",
                      animation: "fadeIn 0.2s ease",
                      borderTop: "1px dashed var(--border)"
                    }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
