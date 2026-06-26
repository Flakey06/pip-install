// file use: In-chat games — Would You Rather + Trivia, earns coins
import { awardCredits } from "../hooks/useCredits";
import { useState, useEffect } from "react";
import { auth, rtdb } from "../firebase";
import { ref, set, onValue, remove } from "firebase/database";
import { WOULD_YOU_RATHER, TRIVIA } from "../utils/gameData";

export default function MiniGame({ groupId, groupName, members, onClose }) {
  const [screen, setScreen] = useState("menu"); 
  const [wyrQuestion, setWyrQuestion] = useState(null);
  const [wyrVotes, setWyrVotes] = useState({ a: [], b: [] });
  const [triviaQuestion, setTriviaQuestion] = useState(null);
  const [triviaAnswers, setTriviaAnswers] = useState({});
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [myVote, setMyVote] = useState(null);
  const me = auth.currentUser?.uid;
  const myUsername = members.find(m => m.uid === me)?.username || "You";
  const isHost = members[0]?.uid === me;

  const gameRef = ref(rtdb, `games/${groupId}`);

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
    await set(gameRef, {
      type: "wyr",
      question: q,
      votes: { a: [], b: [] },
      startedBy: me,
      startedAt: Date.now()
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
  };

  const newWYR = async () => {
    const q = WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)];
    await set(gameRef, {
      type: "wyr",
      question: q,
      votes: { a: [], b: [] },
      startedBy: me,
      startedAt: Date.now()
    });
    setMyVote(null);
  };

  const startTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, {
      type: "trivia",
      question: q,
      answers: {},
      revealed: false,
      startedBy: me,
      startedAt: Date.now()
    });
  };

  const answerTrivia = async (idx) => {
    if (triviaAnswers[me] !== undefined) return;
    await set(ref(rtdb, `games/${groupId}/answers/${me}`), idx);
  };

  const revealTrivia = async () => {
    await set(ref(rtdb, `games/${groupId}/revealed`), true);
  };

  const newTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, {
      type: "trivia",
      question: q,
      answers: {},
      revealed: false,
      startedBy: me,
      startedAt: Date.now()
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
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease"
    }} onClick={screen === "menu" ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "24px 24px 0 0",
        padding: "24px", width: "100%", maxWidth: "480px",
        paddingBottom: "48px", maxHeight: "85vh", overflowY: "auto",
        border: "1.5px solid var(--border-sketch)",
        animation: "fadeUp 0.3s ease"
      }}>
        <div style={{ width: "40px", height: "4px", background: "var(--border-sketch)", borderRadius: "2px", margin: "0 auto 20px" }} />

        {screen === "menu" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎮</div>
              <h3 className="display-font" style={{ fontSize: "22px", color: "var(--text)", marginBottom: "4px" }}>
                Mini Games
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Play with your group in real time!
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
              <button onClick={startWYR} style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "18px", borderRadius: "16px",
                background: "rgba(255,255,255,0.8)",
                border: "1.5px solid var(--border-sketch)",
                boxShadow: "3px 3px 0px var(--border)",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-sketch)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0px var(--border)"; }}
              >
                <div style={{ fontSize: "36px", flexShrink: 0 }}></div>
                <div>
                  <p style={{ margin: "0 0 4px", fontWeight: "800", fontSize: "16px", color: "var(--text)" }}>
                    Would You Rather
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                    Vote between two tricky scenarios
                  </p>
                </div>
              </button>

              <button onClick={startTrivia} style={{
                display: "flex", alignItems: "center", gap: "16px",
                padding: "18px", borderRadius: "16px",
                background: "rgba(255,255,255,0.8)",
                border: "1.5px solid var(--border-sketch)",
                boxShadow: "3px 3px 0px var(--border)",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "5px 5px 0px var(--border-sketch)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "3px 3px 0px var(--border)"; }}
              >
                <div style={{ fontSize: "36px", flexShrink: 0 }}>🧠</div>
                <div>
                  <p style={{ margin: "0 0 4px", fontWeight: "800", fontSize: "16px", color: "var(--text)" }}>
                    Trivia Quiz
                  </p>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                    Answer questions and see who gets it right
                  </p>
                </div>
              </button>
            </div>

            <button className="btn-secondary" onClick={onClose}>Close</button>
          </>
        )}

        {screen === "wyr" && wyrQuestion && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 className="display-font" style={{ fontSize: "18px", color: "var(--text)", margin: 0 }}>
                🤔 Would You Rather
              </h3>
              <button onClick={endGame} style={{
                background: "none", border: "none", color: "var(--text-muted)",
                fontSize: "20px", cursor: "pointer"
              }}>✕</button>
            </div>

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
              {totalVotes}/{members.length} voted
            </p>

            <button onClick={() => voteWYR("a")} disabled={!!myVote} style={{
              width: "100%", padding: "18px", borderRadius: "16px",
              background: myVote === "a"
                ? "linear-gradient(135deg, var(--purple-mid), var(--purple-dark))"
                : "rgba(255,255,255,0.85)",
              border: myVote === "a" ? "none" : "1.5px solid var(--border-sketch)",
              boxShadow: myVote === "a" ? "3px 3px 0px var(--purple-dark)" : "3px 3px 0px var(--border)",
              cursor: myVote ? "default" : "pointer",
              marginBottom: "12px", textAlign: "left",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{
                  fontSize: "13px", fontWeight: "800",
                  color: myVote === "a" ? "rgba(255,255,255,0.8)" : "var(--purple-dark)",
                  background: myVote === "a" ? "rgba(255,255,255,0.2)" : "var(--purple-light)",
                  padding: "3px 10px", borderRadius: "20px", flexShrink: 0
                }}>A</span>
                <p style={{
                  margin: 0, fontSize: "15px", fontWeight: "600", lineHeight: "1.5",
                  color: myVote === "a" ? "white" : "var(--text)", textAlign: "left"
                }}>
                  {wyrQuestion.a}
                </p>
              </div>

              {myVote && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: myVote === "a" ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>
                      {wyrVotes.a?.map(getUserName).join(", ") || "No votes"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: myVote === "a" ? "white" : "var(--purple-dark)" }}>
                      {pctA}%
                    </span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: myVote === "a" ? "rgba(255,255,255,0.3)" : "var(--purple-light)", overflow: "hidden" }}>
                    <div style={{ width: `${pctA}%`, height: "100%", borderRadius: "3px", background: myVote === "a" ? "white" : "var(--purple-dark)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            <div style={{ textAlign: "center", margin: "4px 0 12px" }}>
              <span className="sketch-font" style={{ fontSize: "20px", color: "var(--purple-dark)", fontWeight: "700" }}>OR</span>
            </div>

            <button onClick={() => voteWYR("b")} disabled={!!myVote} style={{
              width: "100%", padding: "18px", borderRadius: "16px",
              background: myVote === "b"
                ? "linear-gradient(135deg, var(--purple-mid), var(--purple-dark))"
                : "rgba(255,255,255,0.85)",
              border: myVote === "b" ? "none" : "1.5px solid var(--border-sketch)",
              boxShadow: myVote === "b" ? "3px 3px 0px var(--purple-dark)" : "3px 3px 0px var(--border)",
              cursor: myVote ? "default" : "pointer",
              marginBottom: "16px", textAlign: "left",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s ease"
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{
                  fontSize: "13px", fontWeight: "800",
                  color: myVote === "b" ? "rgba(255,255,255,0.8)" : "var(--purple-dark)",
                  background: myVote === "b" ? "rgba(255,255,255,0.2)" : "var(--purple-light)",
                  padding: "3px 10px", borderRadius: "20px", flexShrink: 0
                }}>B</span>
                <p style={{
                  margin: 0, fontSize: "15px", fontWeight: "600", lineHeight: "1.5",
                  color: myVote === "b" ? "white" : "var(--text)", textAlign: "left"
                }}>
                  {wyrQuestion.b}
                </p>
              </div>

              {myVote && (
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: myVote === "b" ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>
                      {wyrVotes.b?.map(getUserName).join(", ") || "No votes"}
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: myVote === "b" ? "white" : "var(--purple-dark)" }}>
                      {pctB}%
                    </span>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", background: myVote === "b" ? "rgba(255,255,255,0.3)" : "var(--purple-light)", overflow: "hidden" }}>
                    <div style={{ width: `${pctB}%`, height: "100%", borderRadius: "3px", background: myVote === "b" ? "white" : "var(--purple-dark)", transition: "width 0.5s ease" }} />
                  </div>
                </div>
              )}
            </button>

            {myVote && (
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                You chose <strong>{myVote === "a" ? wyrQuestion.a : wyrQuestion.b}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-secondary" onClick={newWYR} style={{ flex: 1 }}>
                🔀 New Question
              </button>
              <button className="btn-secondary" onClick={endGame} style={{ flex: 1 }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}

        {screen === "trivia" && triviaQuestion && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 className="display-font" style={{ fontSize: "18px", color: "var(--text)", margin: 0 }}>
                🧠 Trivia
              </h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div className="card" style={{ marginBottom: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "16px", fontWeight: "700", color: "var(--text)", lineHeight: "1.5", margin: 0 }}>
                {triviaQuestion.q}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
              {triviaQuestion.options.map((option, idx) => {
                const myAnswer = triviaAnswers[me];
                const isCorrect = idx === triviaQuestion.answer;
                const iChose = myAnswer === idx;
                const answeredCount = Object.keys(triviaAnswers).length;

                let bg = "rgba(255,255,255,0.85)";
                let border = "1.5px solid var(--border-sketch)";
                let color = "var(--text)";
                let shadow = "3px 3px 0px var(--border)";

                if (triviaRevealed) {
                  if (isCorrect) { bg = "rgba(34,197,94,0.15)"; border = "2px solid #22C55E"; color = "#15803D"; shadow = "3px 3px 0px #22C55E"; }
                  else if (iChose) { bg = "rgba(239,68,68,0.1)"; border = "2px solid #EF4444"; color = "#DC2626"; shadow = "3px 3px 0px #EF4444"; }
                } else if (iChose) {
                  bg = "linear-gradient(135deg, var(--purple-mid), var(--purple-dark))";
                  border = "none"; color = "white";
                  shadow = "3px 3px 0px var(--purple-dark)";
                }

                return (
                  <button key={idx} onClick={() => answerTrivia(idx)}
                    disabled={myAnswer !== undefined || triviaRevealed}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "14px 16px", borderRadius: "14px",
                      background: bg, border, color,
                      boxShadow: shadow, cursor: myAnswer !== undefined ? "default" : "pointer",
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "all 0.2s ease", textAlign: "left"
                    }}>
                    <span style={{
                      width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                      background: triviaRevealed && isCorrect ? "#22C55E" : triviaRevealed && iChose ? "#EF4444" : iChose ? "rgba(255,255,255,0.3)" : "var(--purple-light)",
                      color: iChose || (triviaRevealed && isCorrect) ? "white" : "var(--purple-dark)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "13px", fontWeight: "800"
                    }}>
                      {triviaRevealed && isCorrect ? "✓" : triviaRevealed && iChose && !isCorrect ? "✗" : ["A","B","C","D"][idx]}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{option}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                {Object.keys(triviaAnswers).length}/{members.length} answered
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {members.map(m => {
                  const answered = triviaAnswers[m.uid] !== undefined;
                  return (
                    <span key={m.uid} style={{
                      fontSize: "12px", padding: "3px 10px", borderRadius: "20px",
                      background: answered ? "var(--purple-light)" : "rgba(0,0,0,0.05)",
                      color: answered ? "var(--purple-dark)" : "var(--text-muted)",
                      fontWeight: "600", border: "1px solid var(--border)"
                    }}>
                      {answered ? "✓" : "⏳"} {m.username}
                    </span>
                  );
                })}
              </div>
            </div>

            {triviaRevealed && (
              <div style={{
                padding: "14px", borderRadius: "14px", marginBottom: "16px",
                background: "rgba(34,197,94,0.1)", border: "1.5px solid #22C55E",
                textAlign: "center"
              }}>
                <p style={{ fontWeight: "800", color: "#15803D", margin: "0 0 4px", fontSize: "15px" }}>
                  ✅ Correct answer: {triviaQuestion.options[triviaQuestion.answer]}
                </p>
                <p style={{ color: "#15803D", margin: 0, fontSize: "13px" }}>
                  Got it right: {members.filter(m => triviaAnswers[m.uid] === triviaQuestion.answer).map(m => m.username).join(", ") || "Nobody 😅"}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              {!triviaRevealed ? (
                <button className="btn-primary" onClick={revealTrivia} style={{ flex: 1 }}>
                  👁️ Reveal Answer
                </button>
              ) : (
                <button className="btn-primary" onClick={newTrivia} style={{ flex: 1 }}>
                  🔀 Next Question
                </button>
              )}
              <button className="btn-secondary" onClick={endGame} style={{ flex: 1 }}>
                🏠 Menu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
