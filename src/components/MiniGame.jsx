import { useState, useEffect } from "react";
import { auth, rtdb } from "../firebase";
import { ref, set, onValue, remove } from "firebase/database";
import { WOULD_YOU_RATHER, TRIVIA } from "../utils/gameData";
import { awardCredits } from "../hooks/useCredits";

export default function MiniGame({ groupId, groupName, members, onClose }) {
  const [screen, setScreen] = useState("menu");
  const [wyrQuestion, setWyrQuestion] = useState(null);
  const [wyrVotes, setWyrVotes] = useState({ a: [], b: [] });
  const [triviaQuestion, setTriviaQuestion] = useState(null);
  const [triviaAnswers, setTriviaAnswers] = useState({});
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const [coinToast, setCoinToast] = useState("");
  const me = auth.currentUser?.uid;
  const gameRef = ref(rtdb, `games/${groupId}`);

  const showCoinToast = (msg) => {
    setCoinToast(msg);
    setTimeout(() => setCoinToast(""), 2500);
  };

  // Listen to game state in realtime
  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.type === "wyr") {
        setScreen("wyr");
        setWyrQuestion(data.question);
        setWyrVotes(data.votes || { a: [], b: [] });
        const myVoteData = data.votes?.a?.includes(me) ? "a"
          : data.votes?.b?.includes(me) ? "b" : null;
        setMyVote(myVoteData);
      } else if (data.type === "trivia") {
        setScreen("trivia");
        setTriviaQuestion(data.question);
        setTriviaAnswers(data.answers || {});
        setTriviaRevealed(data.revealed || false);
      }
    });
    return () => unsubscribe();
  }, [groupId]);

  const startWYR = async () => {
    const q = WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)];
    await set(gameRef, {
      type: "wyr", question: q,
      votes: { a: [], b: [] },
      startedBy: me, startedAt: Date.now()
    });
  };

  const voteWYR = async (side) => {
    if (myVote) return;
    const newVotes = {
      a: [...(wyrVotes.a || [])].filter(u => u !== me),
      b: [...(wyrVotes.b || [])].filter(u => u !== me)
    };
    newVotes[side] = [...newVotes[side], me];
    await set(ref(rtdb, `games/${groupId}/votes`), newVotes);
    setMyVote(side);
    await awardCredits("wyr_vote");
    showCoinToast("🪙 +2 coins for voting!");
  };

  const newWYR = async () => {
    const q = WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)];
    await set(gameRef, {
      type: "wyr", question: q,
      votes: { a: [], b: [] },
      startedBy: me, startedAt: Date.now()
    });
    setMyVote(null);
  };

  const startTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, {
      type: "trivia", question: q,
      answers: {}, revealed: false,
      startedBy: me, startedAt: Date.now()
    });
  };

  const answerTrivia = async (idx) => {
    if (triviaAnswers[me] !== undefined) return;
    await set(ref(rtdb, `games/${groupId}/answers/${me}`), idx);
    await awardCredits("trivia_play");
    showCoinToast("🪙 +3 coins for playing!");
  };

  const revealTrivia = async () => {
    await set(ref(rtdb, `games/${groupId}/revealed`), true);
    if (triviaAnswers[me] === triviaQuestion?.answer) {
      await awardCredits("trivia_correct");
      showCoinToast("🪙 +10 coins — correct answer!");
    }
  };

  const newTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, {
      type: "trivia", question: q,
      answers: {}, revealed: false,
      startedBy: me, startedAt: Date.now()
    });
  };

  const endGame = async () => {
    await remove(gameRef);
    setScreen("menu");
    setMyVote(null);
    setTriviaRevealed(false);
  };

  const totalVotes = (wyrVotes.a?.length || 0) + (wyrVotes.b?.length || 0);
  const pctA = totalVotes > 0 ? Math.round((wyrVotes.a?.length || 0) / totalVotes * 100) : 50;
  const pctB = 100 - pctA;
  const getUserName = (uid) => members.find(m => m.uid === uid)?.username || "Someone";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.55)", zIndex: 300,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={screen === "menu" ? onClose : undefined}>

      {/* Coin toast */}
      {coinToast && (
        <div style={{
          position: "absolute", top: "20px", left: "50%",
          transform: "translateX(-50%)",
          background: "#0f0f0f", color: "white",
          padding: "10px 20px", borderRadius: "20px",
          fontSize: "14px", fontWeight: "700",
          fontFamily: "Inter, sans-serif",
          zIndex: 400, animation: "fadeUp 0.3s ease"
        }}>
          {coinToast}
        </div>
      )}

      <div onClick={e => e.stopPropagation()} style={{
        background: "white", borderRadius: "20px 20px 0 0",
        padding: "20px 20px 48px", width: "100%", maxWidth: "480px",
        maxHeight: "88vh", overflowY: "auto"
      }}>
        <div style={{ width: "36px", height: "4px", background: "#e0e0e0", borderRadius: "2px", margin: "0 auto 20px" }} />

        {/* ── MENU ── */}
        {screen === "menu" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <p style={{ fontSize: "40px", margin: "0 0 8px" }}>🎮</p>
              <h3 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>
                Mini Games
              </h3>
              <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                Play with your group · earn 🪙 coins
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {[
                { icon: "🤔", title: "Would You Rather", desc: "Vote between two scenarios · +2 🪙", action: startWYR },
                { icon: "🧠", title: "Trivia Quiz", desc: "Answer questions · +3 🪙, +10 🪙 if correct", action: startTrivia },
              ].map(item => (
                <button key={item.title} onClick={item.action} style={{
                  display: "flex", alignItems: "center", gap: "16px",
                  padding: "16px", borderRadius: "14px",
                  background: "#fafafa", border: "1px solid #e8e8e8",
                  cursor: "pointer", textAlign: "left",
                  fontFamily: "Inter, sans-serif",
                  transition: "background 0.15s"
                }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
                  onMouseLeave={e => e.currentTarget.style.background = "#fafafa"}
                >
                  <span style={{ fontSize: "32px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "15px", color: "#0f0f0f" }}>
                      {item.title}
                    </p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#8e8e8e" }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={onClose} className="btn-secondary" style={{ fontSize: "14px" }}>
              Close
            </button>
          </>
        )}

        {/* ── WOULD YOU RATHER ── */}
        {screen === "wyr" && wyrQuestion && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif" }}>
                🤔 Would You Rather
              </h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "#8e8e8e", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
              {totalVotes}/{members.length} voted
              {!myVote && <span style={{ color: "#0f0f0f", fontWeight: "600" }}> · +2 🪙 for voting</span>}
            </p>

            {/* Option A */}
            <button onClick={() => voteWYR("a")} disabled={!!myVote} style={{
              width: "100%", padding: "16px", borderRadius: "14px",
              background: myVote === "a" ? "#0f0f0f" : "white",
              border: myVote === "a" ? "none" : "1.5px solid #e0e0e0",
              cursor: myVote ? "default" : "pointer",
              marginBottom: "10px", textAlign: "left",
              fontFamily: "Inter, sans-serif", transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: "800", padding: "3px 8px",
                  borderRadius: "6px", flexShrink: 0,
                  background: myVote === "a" ? "rgba(255,255,255,0.2)" : "#f0f0f0",
                  color: myVote === "a" ? "white" : "#0f0f0f"
                }}>A</span>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", lineHeight: "1.5", color: myVote === "a" ? "white" : "#0f0f0f" }}>
                  {wyrQuestion.a}
                </p>
              </div>
              {myVote && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: myVote === "a" ? "rgba(255,255,255,0.7)" : "#8e8e8e" }}>
                      {wyrVotes.a?.map(getUserName).join(", ") || "No votes"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: myVote === "a" ? "white" : "#0f0f0f" }}>
                      {pctA}%
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: myVote === "a" ? "rgba(255,255,255,0.3)" : "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ width: `${pctA}%`, height: "100%", borderRadius: "2px", background: myVote === "a" ? "white" : "#0f0f0f", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            {/* OR divider */}
            <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>OR</span>
            </div>

            {/* Option B */}
            <button onClick={() => voteWYR("b")} disabled={!!myVote} style={{
              width: "100%", padding: "16px", borderRadius: "14px",
              background: myVote === "b" ? "#0f0f0f" : "white",
              border: myVote === "b" ? "none" : "1.5px solid #e0e0e0",
              cursor: myVote ? "default" : "pointer",
              marginBottom: "16px", textAlign: "left",
              fontFamily: "Inter, sans-serif", transition: "all 0.2s"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <span style={{
                  fontSize: "11px", fontWeight: "800", padding: "3px 8px",
                  borderRadius: "6px", flexShrink: 0,
                  background: myVote === "b" ? "rgba(255,255,255,0.2)" : "#f0f0f0",
                  color: myVote === "b" ? "white" : "#0f0f0f"
                }}>B</span>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", lineHeight: "1.5", color: myVote === "b" ? "white" : "#0f0f0f" }}>
                  {wyrQuestion.b}
                </p>
              </div>
              {myVote && (
                <div style={{ marginTop: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: myVote === "b" ? "rgba(255,255,255,0.7)" : "#8e8e8e" }}>
                      {wyrVotes.b?.map(getUserName).join(", ") || "No votes"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: myVote === "b" ? "white" : "#0f0f0f" }}>
                      {pctB}%
                    </span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: myVote === "b" ? "rgba(255,255,255,0.3)" : "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ width: `${pctB}%`, height: "100%", borderRadius: "2px", background: myVote === "b" ? "white" : "#0f0f0f", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            {myVote && (
              <p style={{ textAlign: "center", fontSize: "13px", color: "#8e8e8e", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
                You chose <strong style={{ color: "#0f0f0f" }}>{myVote === "a" ? wyrQuestion.a : wyrQuestion.b}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={newWYR} className="btn-secondary" style={{ flex: 1, fontSize: "13px", padding: "10px" }}>
                🔀 New Question
              </button>
              <button onClick={endGame} className="btn-secondary" style={{ flex: 1, fontSize: "13px", padding: "10px" }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}

        {/* ── TRIVIA ── */}
        {screen === "trivia" && triviaQuestion && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif" }}>
                🧠 Trivia
              </h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "#8e8e8e", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            {/* Question */}
            <div style={{
              padding: "16px", borderRadius: "14px",
              background: "#fafafa", border: "1px solid #e8e8e8",
              marginBottom: "16px", textAlign: "center"
            }}>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "#0f0f0f", lineHeight: "1.5", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {triviaQuestion.q}
              </p>
              {!triviaRevealed && triviaAnswers[me] === undefined && (
                <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "8px 0 0", fontFamily: "Inter, sans-serif" }}>
                  +3 🪙 for playing · +10 🪙 if correct
                </p>
              )}
            </div>

            {/* Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {triviaQuestion.options.map((option, idx) => {
                const myAnswer = triviaAnswers[me];
                const isCorrect = idx === triviaQuestion.answer;
                const iChose = myAnswer === idx;

                let bg = "white";
                let border = "1.5px solid #e0e0e0";
                let color = "#0f0f0f";
                let icon = ["A", "B", "C", "D"][idx];

                if (triviaRevealed) {
                  if (isCorrect) { bg = "#f0fdf4"; border = "1.5px solid #22c55e"; color = "#15803d"; icon = "✓"; }
                  else if (iChose && !isCorrect) { bg = "#fff5f5"; border = "1.5px solid #ef4444"; color = "#dc2626"; icon = "✗"; }
                } else if (iChose) {
                  bg = "#0f0f0f"; border = "none"; color = "white";
                }

                return (
                  <button key={idx}
                    onClick={() => answerTrivia(idx)}
                    disabled={myAnswer !== undefined || triviaRevealed}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "13px 16px", borderRadius: "12px",
                      background: bg, border, color,
                      cursor: myAnswer !== undefined ? "default" : "pointer",
                      fontFamily: "Inter, sans-serif", textAlign: "left",
                      transition: "all 0.15s"
                    }}>
                    <span style={{
                      width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                      background: triviaRevealed && isCorrect ? "#22c55e"
                        : triviaRevealed && iChose && !isCorrect ? "#ef4444"
                        : iChose ? "rgba(255,255,255,0.3)" : "#f0f0f0",
                      color: iChose || (triviaRevealed && isCorrect) ? "white" : "#0f0f0f",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: "800"
                    }}>
                      {icon}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Who answered */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                {Object.keys(triviaAnswers).length}/{members.length} answered
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {members.map(m => {
                  const answered = triviaAnswers[m.uid] !== undefined;
                  return (
                    <span key={m.uid} style={{
                      fontSize: "12px", padding: "3px 10px", borderRadius: "20px",
                      background: answered ? "#f0f0f0" : "#fafafa",
                      color: answered ? "#0f0f0f" : "#8e8e8e",
                      fontWeight: answered ? "600" : "400",
                      border: "1px solid #e8e8e8",
                      fontFamily: "Inter, sans-serif"
                    }}>
                      {answered ? "✓" : "⏳"} {m.username}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Correct answer reveal */}
            {triviaRevealed && (
              <div style={{
                padding: "14px", borderRadius: "12px", marginBottom: "16px",
                background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center"
              }}>
                <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 4px", fontSize: "15px", fontFamily: "Inter, sans-serif" }}>
                  ✅ {triviaQuestion.options[triviaQuestion.answer]}
                </p>
                <p style={{ color: "#15803d", margin: 0, fontSize: "13px", fontFamily: "Inter, sans-serif" }}>
                  Got it right: {members.filter(m => triviaAnswers[m.uid] === triviaQuestion.answer).map(m => m.username).join(", ") || "Nobody 😅"}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              {!triviaRevealed ? (
                <button onClick={revealTrivia} className="btn-primary" style={{ flex: 2, fontSize: "13px", padding: "10px" }}>
                  👁️ Reveal Answer
                </button>
              ) : (
                <button onClick={newTrivia} className="btn-primary" style={{ flex: 2, fontSize: "13px", padding: "10px" }}>
                  🔀 Next Question
                </button>
              )}
              <button onClick={endGame} className="btn-secondary" style={{ flex: 1, fontSize: "13px", padding: "10px" }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
