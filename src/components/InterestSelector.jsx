// file purpose: Searchable interest dropdown, add custom interests to Firestore

import { useState, useRef, useEffect } from "react";
import { normalise } from "../hooks/useInterests";

function InterestSelector({ interests, setInterests, allInterests, addToMaster }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleInput = (val) => {
    setInput(val);
    setShowDropdown(true);
    if (val.trim() === "") { setSuggestions([]); return; }
    const norm = normalise(val);
    const filtered = allInterests.filter(i =>
      i.includes(norm) && !interests.includes(i)
    );
    setSuggestions(filtered);
  };

  const selectInterest = (val) => {
    const norm = normalise(val);
    if (norm && !interests.includes(norm)) {
      setInterests(prev => [...prev, norm]);
    }
    setInput("");
    setSuggestions([]);
    setShowDropdown(false);
  };

  const removeInterest = (interest) => {
    setInterests(prev => prev.filter(i => i !== interest));
  };

  const handleAddCustom = async () => {
    const norm = normalise(customInput);
    if (!norm) return;
    if (interests.includes(norm)) {
      alert("You already added this interest!");
      return;
    }
    await addToMaster(norm);
    setInterests(prev => [...prev, norm]);
    setCustomInput("");
    setShowAddModal(false);
  };

  return (
    <div style={{ marginBottom: "28px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <label style={{ color: "var(--text)", fontSize: "14px", fontWeight: "bold" }}>
          Interests
        </label>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            width: "28px", height: "28px",
            borderRadius: "50%",
            background: "#4F46E5",
            color: "var(--bg)",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 1
          }}
        >
          +
        </button>
      </div>

      <div style={{
        display: "flex", flexWrap: "wrap", gap: "8px",
        marginBottom: "12px", minHeight: "10px"
      }}>
        {interests.length === 0 && (
          <p style={{ color: "#aaa", fontSize: "13px", margin: 0 }}>
            No interests selected yet — search below or press + to add your own!
          </p>
        )}
        {interests.map(interest => (
          <span key={interest} style={{
            padding: "6px 12px",
            borderRadius: "20px",
            background: "#4F46E5",
            color: "var(--bg)",
            fontSize: "13px",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            {interest}
            <span
              onClick={() => removeInterest(interest)}
              style={{ cursor: "pointer", fontSize: "16px", lineHeight: 1 }}
            >
            </span>
          </span>
        ))}
      </div>

      <div ref={wrapperRef} style={{ position: "relative" }}>
        <input
          value={input}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && suggestions.length > 0) {
              e.preventDefault();
              selectInterest(suggestions[0]);
            }
            if (e.key === "Escape") setShowDropdown(false);
          }}
          onFocus={() => input && setShowDropdown(true)}
          placeholder="Search interests..."
          style={{
            width: "100%", padding: "12px",
            borderRadius: "10px",
            border: "1.5px solid #e0e0e0",
            fontSize: "15px", outline: "none",
            boxSizing: "border-box", color: "var(--text)"
          }}
        />

        {showDropdown && suggestions.length > 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            border: "1.5px solid #e0e0e0", borderRadius: "10px",
            marginTop: "4px", background: "var(--bg)", zIndex: 100,
            maxHeight: "200px", overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
          }}>
            {suggestions.map(s => (
              <div
                key={s}
                onClick={() => selectInterest(s)}
                style={{
                  padding: "10px 14px", cursor: "pointer",
                  fontSize: "14px", color: "var(--text)",
                  borderBottom: "0.5px solid #f0f0f0"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#f5f5ff"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}
              >
                {s}
              </div>
            ))}
          </div>
        )}

        {showDropdown && input && suggestions.length === 0 && (
          <div style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            border: "1.5px solid #e0e0e0", borderRadius: "10px",
            marginTop: "4px", background: "var(--bg)", zIndex: 100,
            padding: "12px 14px", color: "var(--text-muted)", fontSize: "14px"
          }}>
            No matches — press + to add "{normalise(input)}" as a new interest!
          </div>
        )}
      </div>

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
        "AI", "ai", "A I" are all treated the same ~
      </p>

      {showAddModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            background: "var(--bg)", borderRadius: "16px",
            padding: "28px 24px", width: "90%", maxWidth: "360px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
          }}>
            <h3 style={{ margin: "0 0 8px", color: "var(--text)", fontSize: "18px" }}>
              Add Custom Interest
            </h3>
            <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: "13px" }}>
              "Martial Arts", "MARTIALARTS", "martial arts" — all saved the same way!
            </p>
            <input
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCustom()}
              placeholder="e.g. Martial Arts"
              autoFocus
              style={{
                width: "100%", padding: "12px",
                borderRadius: "10px", border: "1.5px solid #e0e0e0",
                fontSize: "15px", outline: "none",
                boxSizing: "border-box", marginBottom: "16px",
                color: "var(--text)"
              }}
            />
            {customInput && (
              <p style={{ fontSize: "12px", color: "#4F46E5", marginBottom: "12px" }}>
                Will be saved as: "{normalise(customInput)}"
              </p>
            )}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => { setShowAddModal(false); setCustomInput(""); }}
                style={{
                  flex: 1, padding: "12px",
                  background: "var(--bg)", color: "#4F46E5",
                  border: "2px solid #4F46E5", borderRadius: "10px",
                  cursor: "pointer", fontSize: "15px", fontWeight: "bold"
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustom}
                style={{
                  flex: 1, padding: "12px",
                  background: "#4F46E5", color: "var(--bg)",
                  border: "none", borderRadius: "10px",
                  cursor: "pointer", fontSize: "15px", fontWeight: "bold"
                }}
              >
                Add ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterestSelector;