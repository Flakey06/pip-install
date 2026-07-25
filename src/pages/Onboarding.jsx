// file use: welcome screen + tutorial for new users
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to pip install!",
    desc: "You're about to get matched with people who share your interests. Here's how it works.",
    tip: null
  },
  {
    emoji: "🤝",
    title: "Get matched into groups",
    desc: "Go to Explore → tap Match Me. Our algorithm finds people with at least one interest in common with you.",
    tip: "💡 The more interests you add, the better your matches!"
  },
  {
    emoji: "💬",
    title: "Chat with your group",
    desc: "Once matched, chat with your group! Each group has a Topic of the Moment to help break the ice.",
    tip: "💡 Tap a member's avatar to view their profile and add them as a friend."
  },
  {
    emoji: "🎮",
    title: "Play games together",
    desc: "Tap 🎮 in Group Info to play Would You Rather, Trivia, Most Likely To, and more — and earn 🪙 coins!",
    tip: "💡 Use coins to unlock more group slots, profile rings, and badges."
  },
  {
    emoji: "👥",
    title: "Make friends",
    desc: "Add people from your groups as friends. Once mutual, you can see each other's Telegram handles and chat privately.",
    tip: "💡 Your Telegram handle is hidden until you're mutual friends — so it's safe."
  },
  {
    emoji: "🚀",
    title: "You're all set!",
    desc: "Head to Explore to find your first group. Have fun meeting new people!",
    tip: null
  }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), { onboardingDone: true });
      } catch (e) {}
    }
    navigate("/explore");
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 24px"
    }}>
      {/* Progress dots */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? "20px" : "6px", height: "6px",
            borderRadius: "3px",
            background: i === step ? "var(--purple-dark)" : "var(--border)",
            transition: "all 0.3s ease"
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ textAlign: "center", maxWidth: "340px", marginBottom: "40px" }}>
        <p style={{ fontSize: "64px", marginBottom: "20px", animation: "fadeUp 0.4s ease" }}>
          {current.emoji}
        </p>
        <h2 style={{
          fontSize: "24px", fontWeight: "700", color: "var(--text)",
          margin: "0 0 12px", fontFamily: "Inter, sans-serif",
          animation: "fadeUp 0.4s ease"
        }}>
          {current.title}
        </h2>
        <p style={{
          fontSize: "15px", color: "var(--text-muted)", lineHeight: "1.6",
          margin: "0 0 20px", fontFamily: "Inter, sans-serif",
          animation: "fadeUp 0.4s 0.1s ease both"
        }}>
          {current.desc}
        </p>
        {current.tip && (
          <div style={{
            padding: "12px 16px", borderRadius: "12px",
            background: "var(--purple-light)", border: `1px solid var(--border)`,
            animation: "fadeUp 0.4s 0.2s ease both"
          }}>
            <p style={{ fontSize: "13px", color: "var(--purple-dark)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: "500" }}>
              {current.tip}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          className="btn-primary"
          onClick={isLast ? finish : () => setStep(s => s + 1)}
          style={{ fontSize: "16px", padding: "16px" }}
        >
          {isLast ? "Let's go! 🚀" : "Next →"}
        </button>
        {!isLast && (
          <button
            onClick={finish}
            style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "14px", cursor: "pointer", fontFamily: "Inter, sans-serif", padding: "8px" }}
          >
            Skip tutorial
          </button>
        )}
      </div>
    </div>
  );
}
