// file use: In-chat games — WYR, Trivia, Most Likely To, Two Truths, Quick Draw
import { useState, useEffect } from "react";
import { auth, rtdb } from "../firebase";
import { ref, set, onValue, remove, push } from "firebase/database";
import { WOULD_YOU_RATHER, TRIVIA, MOST_LIKELY_TO, TWO_TRUTHS_PROMPTS, QUICK_DRAW_WORDS } from "../utils/gameData";
import { awardCredits } from "../hooks/useCredits";

export default function MiniGame({ groupId, members, onClose }) {
  const [screen, setScreen] = useState("menu");
  const [gameData, setGameData] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [myAnswer, setMyAnswer] = useState(null);
  const [myGuess, setMyGuess] = useState("");
  const [myStatement, setMyStatement] = useState({ t1: "", t2: "", lie: "", submitted: false });
  const [coinToast, setCoinToast] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);

  const me = auth.currentUser?.uid;
  const gameRef = ref(rtdb, `games/${groupId}`);

  const showCoinToast = (msg) => {
    setCoinToast(msg);
    setTimeout(() => setCoinToast(""), 2500);
  };

  // Listen to game state
  useEffect(() => {
    const unsubscribe = onValue(gameRef, (snap) => {
      const data = snap.val();
      if (!data) { setScreen("menu"); setGameData(null); return; }
      setGameData(data);
      setScreen(data.type);
    });
    return () => unsubscribe();
  }, [groupId]);

  // Timer for Quick Draw
  useEffect(() => {
    if (screen !== "quickdraw" || !gameData?.startedAt) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameData.startedAt) / 1000);
      const remaining = 60 - elapsed;
      setTimeLeft(Math.max(0, remaining));
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, gameData?.startedAt]);

  const endGame = async () => {
    setScreen("menu");
    setMyVote(null);
    setMyAnswer(null);
    setMyGuess("");
    setMyStatement({ t1: "", t2: "", lie: "", submitted: false });

    remove(gameRef).catch((error) => {
      console.error("Could not clear game:", error);
    });
  };

  // ── WYR ──
  const startWYR = async () => {
    const q = WOULD_YOU_RATHER[Math.floor(Math.random() * WOULD_YOU_RATHER.length)];
    const nextGame = {
      type: "wyr",
      question: q,
      votes: { a: [], b: [] },
      startedBy: me,
      startedAt: Date.now()
    };

    setGameData(nextGame);
    setScreen("wyr");
    setMyVote(null);

    set(gameRef, nextGame).catch((error) => {
      console.error("Could not start Would You Rather:", error);
    });
  };

  const voteWYR = async (side) => {
    if (myVote) return;
    const votes = gameData?.votes || { a: [], b: [] };
    const newVotes = {
      a: (votes.a || []).filter(u => u !== me),
      b: (votes.b || []).filter(u => u !== me)
    };
    newVotes[side] = [...newVotes[side], me];
    await set(ref(rtdb, `games/${groupId}/votes`), newVotes);
    setMyVote(side);
    await awardCredits("wyr_vote");
    showCoinToast("🪙 +2 coins!");
  };

  // ── TRIVIA ──
  const startTrivia = async () => {
    const q = TRIVIA[Math.floor(Math.random() * TRIVIA.length)];
    await set(gameRef, { type: "trivia", question: q, answers: {}, revealed: false, startedBy: me, startedAt: Date.now() });
    setMyAnswer(null);
  };

  const answerTrivia = async (idx) => {
    if (gameData?.answers?.[me] !== undefined) return;
    await set(ref(rtdb, `games/${groupId}/answers/${me}`), idx);
    setMyAnswer(idx);
    await awardCredits("trivia_play");
    showCoinToast("🪙 +3 coins!");
  };

  const revealTrivia = async () => {
    await set(ref(rtdb, `games/${groupId}/revealed`), true);
    if (gameData?.answers?.[me] === gameData?.question?.answer) {
      await awardCredits("trivia_correct");
      showCoinToast("🪙 +10 coins — correct!");
    }
  };

  // ── MOST LIKELY TO ──
  const startMLT = async () => {
    const prompt = MOST_LIKELY_TO[Math.floor(Math.random() * MOST_LIKELY_TO.length)];
    await set(gameRef, { type: "mostlikelyto", prompt, votes: {}, startedBy: me, startedAt: Date.now() });
    setMyVote(null);
  };

  const voteMLT = async (targetUid) => {
    if (gameData?.votes?.[me]) return;
    await set(ref(rtdb, `games/${groupId}/votes/${me}`), targetUid);
    setMyVote(targetUid);
    await awardCredits("wyr_vote");
    showCoinToast("🪙 +2 coins!");
  };

  // ── TWO TRUTHS ONE LIE ──
  const startTTL = async () => {
    const prompt = TWO_TRUTHS_PROMPTS[Math.floor(Math.random() * TWO_TRUTHS_PROMPTS.length)];
    const firstPlayer = members[Math.floor(Math.random() * members.length)]?.uid;
    await set(gameRef, { type: "twotruths", prompt, currentPlayer: firstPlayer, statements: {}, guesses: {}, revealed: false, startedBy: me, startedAt: Date.now() });
    setMyStatement({ t1: "", t2: "", lie: "", submitted: false });
  };

  const submitStatements = async () => {
    if (!myStatement.t1 || !myStatement.t2 || !myStatement.lie) return;
    await set(ref(rtdb, `games/${groupId}/statements/${me}`), {
      items: [myStatement.t1, myStatement.t2, myStatement.lie].sort(() => Math.random() - 0.5),
      lie: myStatement.lie
    });
    setMyStatement(p => ({ ...p, submitted: true }));
  };

  const guessLie = async (playerUid, guessIdx) => {
    if (gameData?.guesses?.[me]?.[playerUid] !== undefined) return;
    await set(ref(rtdb, `games/${groupId}/guesses/${me}/${playerUid}`), guessIdx);
    const statements = gameData?.statements?.[playerUid];
    if (statements && statements.items[guessIdx] === statements.lie) {
      await awardCredits("trivia_correct");
      showCoinToast("🪙 +10 coins — found the lie!");
    } else {
      await awardCredits("trivia_play");
      showCoinToast("🪙 +3 coins for guessing!");
    }
  };

  const revealTTL = async () => {
    await set(ref(rtdb, `games/${groupId}/revealed`), true);
  };

  const startQuickDraw = async () => {
    const word = QUICK_DRAW_WORDS[Math.floor(Math.random() * QUICK_DRAW_WORDS.length)];
    const drawer = members[Math.floor(Math.random() * members.length)]?.uid;
    await set(gameRef, { type: "quickdraw", word, drawer, guesses: {}, solved: false, startedBy: me, startedAt: Date.now() });
    setMyGuess("");
    setTimeLeft(60);
  };

  const submitGuess = async () => {
    if (!myGuess.trim() || gameData?.solved) return;
    const guess = myGuess.trim().toLowerCase();
    const word = gameData?.word?.toLowerCase();
    await push(ref(rtdb, `games/${groupId}/guesses`), { uid: me, text: myGuess.trim(), correct: guess === word, at: Date.now() });
    if (guess === word) {
      await set(ref(rtdb, `games/${groupId}/solved`), true);
      await set(ref(rtdb, `games/${groupId}/solvedBy`), me);
      await awardCredits("trivia_correct");
      showCoinToast("🪙 +10 coins — you got it!");
    }
    setMyGuess("");
  };

  const getUserName = (uid) => members.find(m => m.uid === uid)?.username || "Someone";
  const isMe = (uid) => uid === me;

  // ── STYLES ──
  const menuBtnStyle = {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "14px 16px", borderRadius: "14px",
    background: "var(--card)", border: "1px solid var(--border)",
    cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
    width: "100%", transition: "background 0.15s"
  };

  const actionBtnStyle = (primary) => ({
    flex: 1, padding: "12px",
    background: primary ? "var(--purple-dark)" : "var(--card)",
    color: primary ? "var(--bg)" : "var(--text)",
    border: primary ? "none" : "1px solid var(--border)",
    borderRadius: "10px", fontSize: "13px", fontWeight: "600",
    cursor: "pointer", fontFamily: "Inter, sans-serif"
  });

  const wyrVotes = gameData?.votes || { a: [], b: [] };
  const totalWYR = (wyrVotes.a?.length || 0) + (wyrVotes.b?.length || 0);
  const pctA = totalWYR > 0 ? Math.round((wyrVotes.a?.length || 0) / totalWYR * 100) : 50;
  const pctB = 100 - pctA;

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
          background: "var(--text)", color: "var(--bg)",
          padding: "10px 24px", borderRadius: "24px",
          fontSize: "14px", fontWeight: "700",
          fontFamily: "Inter, sans-serif", zIndex: 500,
          whiteSpace: "nowrap", boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
        }}>
          {coinToast}
        </div>
      )}

      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        padding: "20px 20px 48px", width: "100%", maxWidth: "480px",
        maxHeight: "88vh", overflowY: "auto"
      }}>
        <div style={{ width: "36px", height: "4px", background: "var(--border)", borderRadius: "2px", margin: "0 auto 20px" }} />

        {/* ── MENU ── */}
        {screen === "menu" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <p style={{ fontSize: "36px", margin: "0 0 6px" }}>🎮</p>
              <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 2px", fontFamily: "Inter, sans-serif", color: "var(--text)" }}>Mini Games</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, fontFamily: "Inter, sans-serif" }}>Play together · earn 🪙 coins</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {[
                { icon: "🤔", title: "Would You Rather", desc: "Vote A or B · +2 🪙", action: startWYR },
                { icon: "🧠", title: "Trivia Quiz", desc: "Answer questions · +3🪙, +10🪙 correct", action: startTrivia },
                { icon: "👆", title: "Most Likely To", desc: "Vote who in the group · +2 🪙", action: startMLT },
                { icon: "🤥", title: "Two Truths One Lie", desc: "Find the lie · +10🪙 correct", action: startTTL },
                { icon: "✏️", title: "Guess The Word", desc: "Guess the word · +10🪙 first guess", action: startQuickDraw },
              ].map(item => (
                <button key={item.title} onClick={item.action} style={menuBtnStyle}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--input-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "var(--card)"}
                >
                  <span style={{ fontSize: "28px", flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: "700", fontSize: "14px", color: "var(--text)" }}>{item.title}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <button onClick={onClose} style={actionBtnStyle(false)}>Close</button>
          </>
        )}

        {/* ── WOULD YOU RATHER ── */}
        {screen === "wyr" && gameData?.question && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif", color: "var(--text)" }}>🤔 Would You Rather</h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px", fontFamily: "Inter, sans-serif" }}>
              {totalWYR}/{members.length} voted{!myVote && <span style={{ color: "var(--purple-dark)", fontWeight: "600" }}> · +2 🪙</span>}
            </p>

            {["a", "b"].map((side, i) => {
              const pct = side === "a" ? pctA : pctB;
              const voted = myVote === side;
              const votes = side === "a" ? wyrVotes.a : wyrVotes.b;
              return (
                <div key={side}>
                  <button onClick={() => voteWYR(side)} disabled={!!myVote} style={{
                    width: "100%", padding: "14px", borderRadius: "12px",
                    background: voted ? "var(--purple-dark)" : "var(--card)",
                    border: voted ? "none" : `1.5px solid var(--border)`,
                    cursor: myVote ? "default" : "pointer",
                    marginBottom: "8px", textAlign: "left",
                    fontFamily: "Inter, sans-serif", transition: "all 0.2s"
                  }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "800", padding: "2px 8px",
                        borderRadius: "6px", flexShrink: 0,
                        background: voted ? "rgba(255,255,255,0.2)" : "var(--purple-light)",
                        color: voted ? "var(--bg)" : "var(--purple-dark)"
                      }}>{side.toUpperCase()}</span>
                      <p style={{ margin: 0, fontSize: "14px", fontWeight: "600", lineHeight: "1.5", color: voted ? "var(--bg)" : "var(--text)" }}>
                        {side === "a" ? gameData.question.a : gameData.question.b}
                      </p>
                    </div>
                    {myVote && (
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "11px", color: voted ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                            {(votes || []).map(getUserName).join(", ") || "No votes"}
                          </span>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: voted ? "var(--bg)" : "var(--text)" }}>{pct}%</span>
                        </div>
                        <div style={{ height: "4px", borderRadius: "2px", background: voted ? "rgba(255,255,255,0.3)" : "var(--border)", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: voted ? "var(--bg)" : "var(--purple-dark)", transition: "width 0.5s" }} />
                        </div>
                      </div>
                    )}
                  </button>
                  {i === 0 && <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>OR</p>}
                </div>
              );
            })}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={startWYR} style={actionBtnStyle(false)}>🔀 New</button>
              <button onClick={endGame} style={actionBtnStyle(false)}>🏠 Menu</button>
            </div>
          </>
        )}

        {/* ── TRIVIA ── */}
        {screen === "trivia" && gameData?.question && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif", color: "var(--text)" }}>🧠 Trivia</h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "14px", borderRadius: "12px", background: "var(--card)", border: `1px solid var(--border)`, marginBottom: "14px", textAlign: "center" }}>
              <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--text)", margin: 0, fontFamily: "Inter, sans-serif", lineHeight: "1.5" }}>
                {gameData.question.q}
              </p>
              {!gameData?.answers?.[me] && !gameData?.revealed && (
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>+3🪙 play · +10🪙 correct</p>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {gameData.question.options.map((opt, idx) => {
                const answered = gameData?.answers?.[me];
                const isCorrect = idx === gameData.question.answer;
                const iChose = answered === idx;
                let bg = "var(--card)", border = `1.5px solid var(--border)`, color = "var(--text)", icon = ["A","B","C","D"][idx];
                if (gameData?.revealed) {
                  if (isCorrect) { bg = "#f0fdf4"; border = "1.5px solid #22c55e"; color = "#15803d"; icon = "✓"; }
                  else if (iChose) { bg = "#fff5f5"; border = "1.5px solid #ef4444"; color = "#dc2626"; icon = "✗"; }
                } else if (iChose) { bg = "var(--purple-dark)"; border = "none"; color = "var(--bg)"; }
                return (
                  <button key={idx} onClick={() => answerTrivia(idx)}
                    disabled={answered !== undefined || gameData?.revealed}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "10px", background: bg, border, color, cursor: answered !== undefined ? "default" : "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}>
                    <span style={{ width: "24px", height: "24px", borderRadius: "50%", flexShrink: 0, background: iChose || (gameData?.revealed && isCorrect) ? "rgba(255,255,255,0.3)" : "var(--input-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "800", color: "inherit" }}>
                      {icon}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{opt}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: "14px" }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 6px", fontFamily: "Inter, sans-serif" }}>
                {Object.keys(gameData?.answers || {}).length}/{members.length} answered
              </p>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {members.map(m => (
                  <span key={m.uid} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: gameData?.answers?.[m.uid] !== undefined ? "var(--purple-light)" : "var(--input-bg)", color: gameData?.answers?.[m.uid] !== undefined ? "var(--purple-dark)" : "var(--text-muted)", fontFamily: "Inter, sans-serif", border: `1px solid var(--border)` }}>
                    {gameData?.answers?.[m.uid] !== undefined ? "✓" : "⏳"} {m.username}
                  </span>
                ))}
              </div>
            </div>

            {gameData?.revealed && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center", marginBottom: "14px" }}>
                <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 2px", fontSize: "14px", fontFamily: "Inter, sans-serif" }}>
                  ✅ {gameData.question.options[gameData.question.answer]}
                </p>
                <p style={{ color: "#15803d", margin: 0, fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
                  Correct: {members.filter(m => gameData?.answers?.[m.uid] === gameData.question.answer).map(m => m.username).join(", ") || "Nobody 😅"}
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              {!gameData?.revealed
                ? <button onClick={revealTrivia} style={actionBtnStyle(true)}>👁️ Reveal</button>
                : <button onClick={startTrivia} style={actionBtnStyle(true)}>🔀 Next</button>
              }
              <button onClick={endGame} style={actionBtnStyle(false)}>🏠 Menu</button>
            </div>
          </>
        )}

        {/* ── MOST LIKELY TO ── */}
        {screen === "mostlikelyto" && gameData?.prompt && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif", color: "var(--text)" }}>👆 Most Likely To</h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--purple-light)", border: `1px solid var(--border)`, marginBottom: "20px", textAlign: "center" }}>
              <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--purple-dark)", margin: "0 0 6px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Who is most likely to...</p>
              <p style={{ fontSize: "17px", fontWeight: "700", color: "var(--text)", margin: 0, fontFamily: "Inter, sans-serif" }}>
                {gameData.prompt}
              </p>
              {!gameData?.votes?.[me] && <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>+2 🪙 for voting</p>}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "14px" }}>
              {members.map(m => {
                const voted = gameData?.votes?.[me];
                const votedForThis = gameData?.votes?.[me] === m.uid;
                const voteCount = Object.values(gameData?.votes || {}).filter(v => v === m.uid).length;
                return (
                  <button key={m.uid} onClick={() => voteMLT(m.uid)} disabled={!!voted}
                    style={{
                      display: "flex", alignItems: "center", gap: "12px",
                      padding: "12px 14px", borderRadius: "12px",
                      background: votedForThis ? "var(--purple-dark)" : "var(--card)",
                      border: votedForThis ? "none" : `1px solid var(--border)`,
                      cursor: voted ? "default" : "pointer",
                      fontFamily: "Inter, sans-serif", transition: "all 0.15s"
                    }}>
                    <img src={m.photoURL} alt={m.username} style={{ width: "36px", height: "36px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                    <p style={{ flex: 1, margin: 0, fontWeight: "600", fontSize: "14px", color: votedForThis ? "var(--bg)" : "var(--text)", textAlign: "left" }}>
                      {m.username} {isMe(m.uid) ? "(you)" : ""}
                    </p>
                    {voted && voteCount > 0 && (
                      <span style={{ fontSize: "13px", fontWeight: "700", color: votedForThis ? "var(--bg)" : "var(--purple-dark)", background: votedForThis ? "rgba(255,255,255,0.2)" : "var(--purple-light)", padding: "2px 10px", borderRadius: "20px" }}>
                        {voteCount} vote{voteCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {gameData?.votes?.[me] && (
              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginBottom: "14px", fontFamily: "Inter, sans-serif" }}>
                You voted for <strong style={{ color: "var(--text)" }}>{getUserName(gameData.votes[me])}</strong>
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={startMLT} style={actionBtnStyle(false)}>🔀 New</button>
              <button onClick={endGame} style={actionBtnStyle(false)}>🏠 Menu</button>
            </div>
          </>
        )}

        {/* ── TWO TRUTHS ONE LIE ── */}
        {screen === "twotruths" && gameData && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif", color: "var(--text)" }}>🤥 Two Truths One Lie</h3>
              <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ padding: "12px", borderRadius: "10px", background: "var(--purple-light)", marginBottom: "16px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--purple-dark)", margin: 0, fontFamily: "Inter, sans-serif", fontWeight: "600" }}>
                {gameData.prompt}
              </p>
            </div>

            {/* My submission */}
            {!gameData?.statements?.[me] && !myStatement.submitted && (
              <div style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", margin: "0 0 10px", fontFamily: "Inter, sans-serif" }}>Your turn — enter 2 truths and 1 lie:</p>
                {[
                  { label: "Truth 1", key: "t1" },
                  { label: "Truth 2", key: "t2" },
                  { label: "The Lie 🤥", key: "lie" },
                ].map(field => (
                  <div key={field.key} style={{ marginBottom: "8px" }}>
                    <label className="input-label">{field.label}</label>
                    <input className="input-underline" value={myStatement[field.key]}
                      onChange={e => setMyStatement(p => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.key === "lie" ? "This is the lie..." : "This is true..."}
                    />
                  </div>
                ))}
                <button onClick={submitStatements} style={{ ...actionBtnStyle(true), width: "100%", marginTop: "12px" }}>
                  Submit ✅
                </button>
              </div>
            )}

            {/* Others' statements to guess */}
            {Object.entries(gameData?.statements || {}).map(([playerUid, data]) => {
              if (playerUid === me) return null;
              const myGuessForThis = gameData?.guesses?.[me]?.[playerUid];
              const revealed = gameData?.revealed;
              return (
                <div key={playerUid} style={{ marginBottom: "16px" }}>
                  <p style={{ fontSize: "13px", fontWeight: "700", color: "var(--text)", margin: "0 0 8px", fontFamily: "Inter, sans-serif" }}>
                    {getUserName(playerUid)}'s statements — find the lie:
                  </p>
                  {data.items.map((item, idx) => {
                    const isLie = item === data.lie;
                    const iGuessed = myGuessForThis === idx;
                    let bg = "var(--card)", border = `1px solid var(--border)`, color = "var(--text)";
                    if (revealed && isLie) { bg = "#fff5f5"; border = "1.5px solid #ef4444"; color = "#dc2626"; }
                    else if (revealed && !isLie) { bg = "#f0fdf4"; border = "1.5px solid #22c55e"; color = "#15803d"; }
                    else if (iGuessed) { bg = "var(--purple-dark)"; border = "none"; color = "var(--bg)"; }
                    return (
                      <button key={idx} onClick={() => guessLie(playerUid, idx)}
                        disabled={myGuessForThis !== undefined || revealed}
                        style={{ display: "block", width: "100%", padding: "10px 14px", borderRadius: "10px", background: bg, border, color, cursor: myGuessForThis !== undefined ? "default" : "pointer", fontFamily: "Inter, sans-serif", textAlign: "left", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>
                        {revealed && isLie ? "🤥 LIE: " : revealed ? "✅ TRUTH: " : ""}{item}
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {Object.keys(gameData?.statements || {}).length > 0 && (
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px", fontFamily: "Inter, sans-serif" }}>
                {Object.keys(gameData?.statements || {}).length}/{members.length} submitted
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              {!gameData?.revealed
                ? <button onClick={revealTTL} style={actionBtnStyle(true)}>👁️ Reveal Lies</button>
                : <button onClick={startTTL} style={actionBtnStyle(true)}>🔀 New Round</button>
              }
              <button onClick={endGame} style={actionBtnStyle(false)}>🏠 Menu</button>
            </div>
          </>
        )}

        {/* ── QUICK DRAW ── */}
        {screen === "quickdraw" && gameData && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "700", margin: 0, fontFamily: "Inter, sans-serif", color: "var(--text)" }}>✏️ Quick Draw</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {timeLeft !== null && (
                  <span style={{ fontSize: "14px", fontWeight: "700", color: timeLeft < 10 ? "#ef4444" : "var(--text)", fontFamily: "Inter, sans-serif" }}>
                    ⏱ {timeLeft}s
                  </span>
                )}
                <button onClick={endGame} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
            </div>

            {/* Drawer sees the word */}
            {gameData?.drawer === me && (
              <div style={{ padding: "14px", borderRadius: "12px", background: "var(--purple-dark)", marginBottom: "14px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "0 0 4px", fontFamily: "Inter, sans-serif", textTransform: "uppercase", letterSpacing: "0.06em" }}>Your word to describe:</p>
                <p style={{ fontSize: "28px", fontWeight: "800", color: "var(--bg)", margin: 0, fontFamily: "Inter, sans-serif" }}>{gameData.word}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "6px 0 0", fontFamily: "Inter, sans-serif" }}>Describe it without saying the word!</p>
              </div>
            )}

            {/* Others guess */}
            {gameData?.drawer !== me && (
              <div style={{ marginBottom: "14px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 10px", fontFamily: "Inter, sans-serif" }}>
                  <strong style={{ color: "var(--text)" }}>{getUserName(gameData.drawer)}</strong> is describing a word — guess it! (+10 🪙 first correct)
                </p>
                {!gameData?.solved && timeLeft > 0 && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      value={myGuess}
                      onChange={e => setMyGuess(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && submitGuess()}
                      placeholder="Type your guess..."
                      className="input-underline"
                      style={{ flex: 1 }}
                    />
                    <button onClick={submitGuess} style={{ ...actionBtnStyle(true), width: "auto", padding: "8px 16px" }}>
                      Guess
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Solved banner */}
            {gameData?.solved && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "#f0fdf4", border: "1px solid #bbf7d0", textAlign: "center", marginBottom: "14px" }}>
                <p style={{ fontWeight: "700", color: "#15803d", margin: "0 0 2px", fontSize: "15px", fontFamily: "Inter, sans-serif" }}>
                  ✅ {gameData.word}
                </p>
                <p style={{ color: "#15803d", margin: 0, fontSize: "12px", fontFamily: "Inter, sans-serif" }}>
                  First solved by {getUserName(gameData.solvedBy)}!
                </p>
              </div>
            )}

            {/* Time up */}
            {timeLeft === 0 && !gameData?.solved && (
              <div style={{ padding: "12px", borderRadius: "10px", background: "#fff5f5", border: "1px solid #fecaca", textAlign: "center", marginBottom: "14px" }}>
                <p style={{ fontWeight: "700", color: "#dc2626", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>⏰ Time's up!</p>
                <p style={{ color: "#dc2626", margin: 0, fontSize: "12px", fontFamily: "Inter, sans-serif" }}>The word was: <strong>{gameData.word}</strong></p>
              </div>
            )}

            {/* Guess log */}
            <div style={{ maxHeight: "160px", overflowY: "auto", marginBottom: "14px" }}>
              {Object.entries(gameData?.guesses || {}).sort((a, b) => (a[1]?.at || 0) - (b[1]?.at || 0)).map(([key, g]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "Inter, sans-serif" }}>{getUserName(g.uid)}:</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: g.correct ? "#15803d" : "var(--text)", fontFamily: "Inter, sans-serif" }}>
                    {g.text} {g.correct ? "✅" : ""}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={startQuickDraw} style={actionBtnStyle(true)}>🔀 New Word</button>
              <button onClick={endGame} style={actionBtnStyle(false)}>🏠 Menu</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
