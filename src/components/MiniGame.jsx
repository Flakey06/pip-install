// file use: In-chat games — Would You Rather + Trivia, earns coins
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

  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.type === "wyr") {
        setScreen("wyr");
        setWyrQuestion(data.question);
        setWyrVotes(data.votes || { a: [], b: [] });
        const myVoteData = data.votes?.a?.includes(me) ? "a" : data.votes?.b?.includes(me) ? "b" : null;
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
    await set(gameRef, { type: "wyr", question: q, votes: { a: [], b: [] }, startedBy: me, startedAt: Date.now() });
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
    await set(gameRef, { type: "wyr", question: q, votes: { a: [], b: [] }, startedBy: me, startedAt: Date.now() });
    setMyVote(null);
  };

  const startTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, { type: "trivia", question: q, answers: {}, revealed: false, startedBy: me, startedAt: Date.now() });
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
    await set(gameRef, { type: "trivia", question: q, answers: {}, revealed: false, startedBy: me, startedAt: Date.now() });
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
          position: "fixed", top: "40px", left: "50%",
          transform: "translateX(-50%)",
          background: "var(--purple-dark)", color: "var(--bg)",
          padding: "12px 24px", borderRadius: "24px",
          fontSize: "15px", fontWeight: "700",
          fontFamily: "Inter, sans-serif",
          zIndex: 500, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          animation: "fadeUp 0.3s ease"
        }}>
          {coinToast}
        </div>
      )}

      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
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
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>
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
                  background: "var(--card)", border: "1px solid var(--border)",
                  cursor: "pointer", textAlign: "left",
                  fontFamily: "Inter, sans-serif"
                }}>
                  <span style={{ fontSize: "32px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: "0 0 3px", fontWeight: "700", fontSize: "15px", color: "var(--text)" }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={onClose} style={{
              width: "100%", padding: "13px", background: "var(--card)",
              border: "1px solid var(--border)", borderRadius: "12px",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              fontFamily: "Inter, sans-serif"
            }}>
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
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 20px", fontFamily: "Inter, sans-serif" }}>
              {totalVotes}/{members.length} voted
              {!myVote && <span style={{ color: "var(--text)", fontWeight: "600" }}> · +2 🪙 for voting</span>}
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
                    <span style={{ fontSize: "13px", fontWeight: "700", color: myVote === "a" ? "white" : "#0f0f0f" }}>{pctA}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: myVote === "a" ? "rgba(255,255,255,0.3)" : "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ width: `${pctA}%`, height: "100%", borderRadius: "2px", background: myVote === "a" ? "white" : "#0f0f0f", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            <div style={{ textAlign: "center", margin: "4px 0 10px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>OR</span>
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
                    <span style={{ fontSize: "13px", fontWeight: "700", color: myVote === "b" ? "white" : "#0f0f0f" }}>{pctB}%</span>
                  </div>
                  <div style={{ height: "4px", borderRadius: "2px", background: myVote === "b" ? "rgba(255,255,255,0.3)" : "#f0f0f0", overflow: "hidden" }}>
                    <div style={{ width: `${pctB}%`, height: "100%", borderRadius: "2px", background: myVote === "b" ? "white" : "#0f0f0f", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            {myVote && (
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px", fontFamily: "Inter, sans-serif" }}>
                You chose <strong style={{ color: "var(--text)" }}>{myVote === "a" ? wyrQuestion.a : wyrQuestion.b}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={newWYR} style={{ flex: 1, padding: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                🔀 New Question
              </button>
              <button onClick={endGame} style={{ flex: 1, padding: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}

        {/* ── TRIVIA ── */}
        {screen === "trivia" && triviaQuestion && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif" }}>🧠 Trivia</h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "16px", borderRadius: "14px", background: "var(--card)", border: "1px solid var(--border)", marginBottom: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", lineHeight: "1.5", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {triviaQuestion.q}
              </p>
              {triviaAnswers[me] === undefined && !triviaRevealed && (
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "8px 0 0", fontFamily: "Inter, sans-serif" }}>
                  +3 🪙 for playing · +10 🪙 if correct
                </p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
              {triviaQuestion.options.map((option, idx) => {
                const myAnswer = triviaAnswers[me];
                const isCorrect = idx === triviaQuestion.answer;
                const iChose = myAnswer === idx;

                let bg = "white", border = "1.5px solid #e0e0e0", color = "#0f0f0f", icon = ["A","B","C","D"][idx];
                if (triviaRevealed) {
                  if (isCorrect) { bg = "#f0fdf4"; border = "1.5px solid #22c55e"; color = "#15803d"; icon = "✓"; }
                  else if (iChose) { bg = "#fff5f5"; border = "1.5px solid #ef4444"; color = "#dc2626"; icon = "✗"; }
                } else if (iChose) {
                  bg = "#0f0f0f"; border = "none"; color = "white";
                }

                return (
                  <button key={idx} onClick={() => answerTrivia(idx)}
                    disabled={myAnswer !== undefined || triviaRevealed}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "13px 16px", borderRadius: "12px",
                      background: bg, border, color,
                      cursor: myAnswer !== undefined ? "default" : "pointer",
                      fontFamily: "Inter, sans-serif", textAlign: "left", transition: "all 0.15s"
                    }}>
                    <span style={{
                      width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
                      background: triviaRevealed && isCorrect ? "#22c55e" : triviaRevealed && iChose && !isCorrect ? "#ef4444" : iChose ? "rgba(255,255,255,0.3)" : "#f0f0f0",
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

            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
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
                      border: "1px solid var(--border)", fontFamily: "Inter, sans-serif"
                    }}>
                      {answered ? "✓" : "⏳"} {m.username}
                    </span>
                  );
                })}
              </div>
            </div>

            {triviaRevealed && (
              <div style={{ padding: "14px", borderRadius: "12px", marginBottom: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center" }}>
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
                <button onClick={revealTrivia} style={{ flex: 2, padding: "12px", background: "var(--purple-dark)", color: "var(--bg)", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  👁️ Reveal Answer
                </button>
              ) : (
                <button onClick={newTrivia} style={{ flex: 2, padding: "12px", background: "var(--purple-dark)", color: "var(--bg)", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  🔀 Next Question
                </button>
              )}
              <button onClick={endGame} style={{ flex: 1, padding: "12px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "10px", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
