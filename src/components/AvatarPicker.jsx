// code use: avatar modal — upload photo (Base64) or build cartoon SVG
import { useState, useRef } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";

const SKIN_TONES  = ["#FDDBB4","#F5CBA7","#E59866","#CA9E67","#8D5524","#4A2912"];
const HAIR_COLORS = ["#1a1a1a","#4a3728","#8B4513","#DAA520","#FF6B6B","#9B59B6","#FFFFFF"];
const HAIR_STYLES = ["short","long","curly","bun","none"];
const EYE_COLORS  = ["#1a1a1a","#4169E1","#228B22","#8B4513","#708090"];
const MOUTH_STYLES= ["smile","grin","neutral","smirk"];

function CartoonAvatar({ options, size = 80 }) {
  const { skin, hair, hairStyle, eyes, mouth } = options;
  const s = size, cx = s / 2;
  const hairPaths = {
    short:  `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} Q${cx+s*.3} ${s*.22} ${cx} ${s*.18} Q${cx-s*.3} ${s*.22} ${cx-s*.28} ${s*.38}Z`,
    long:   `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} L${cx+s*.32} ${s*.75} Q${cx+s*.28} ${s*.8} ${cx+s*.22} ${s*.7} L${cx-s*.22} ${s*.7} Q${cx-s*.28} ${s*.8} ${cx-s*.32} ${s*.75}Z`,
    curly:  `M${cx-s*.28} ${s*.38} Q${cx-s*.35} ${s*.1} ${cx} ${s*.12} Q${cx+s*.35} ${s*.1} ${cx+s*.28} ${s*.38} Q${cx+s*.38} ${s*.2} ${cx+s*.15} ${s*.15} Q${cx} ${s*.08} ${cx-s*.15} ${s*.15} Q${cx-s*.38} ${s*.2} ${cx-s*.28} ${s*.38}Z`,
    bun:    `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} Q${cx+s*.3} ${s*.22} ${cx} ${s*.18} Q${cx-s*.3} ${s*.22} ${cx-s*.28} ${s*.38}Z M${cx-s*.1} ${s*.15} Q${cx} ${s*.02} ${cx+s*.1} ${s*.15} Q${cx} ${s*.22} ${cx-s*.1} ${s*.15}Z`,
    none:   ""
  };
  const mouthPaths = {
    smile:   `M${cx-s*.12} ${s*.62} Q${cx} ${s*.72} ${cx+s*.12} ${s*.62}`,
    grin:    `M${cx-s*.14} ${s*.61} Q${cx} ${s*.74} ${cx+s*.14} ${s*.61} L${cx+s*.14} ${s*.64} Q${cx} ${s*.76} ${cx-s*.14} ${s*.64}Z`,
    neutral: `M${cx-s*.1} ${s*.65} L${cx+s*.1} ${s*.65}`,
    smirk:   `M${cx-s*.08} ${s*.65} Q${cx+s*.06} ${s*.6} ${cx+s*.12} ${s*.63}`
  };
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      {hairStyle !== "none" && <path d={hairPaths[hairStyle]} fill={hair} />}
      <ellipse cx={cx} cy={s*.48} rx={s*.26} ry={s*.3} fill={skin} />
      <ellipse cx={cx-s*.09} cy={s*.43} rx={s*.05} ry={s*.055} fill={eyes} />
      <ellipse cx={cx+s*.09} cy={s*.43} rx={s*.05} ry={s*.055} fill={eyes} />
      <circle cx={cx-s*.09} cy={s*.42} r={s*.018} fill="white" opacity="0.6" />
      <circle cx={cx+s*.09} cy={s*.42} r={s*.018} fill="white" opacity="0.6" />
      <path d={mouthPaths[mouth]} fill="none" stroke="#c0706a" strokeWidth={s*.025} strokeLinecap="round" />
      <ellipse cx={cx-s*.18} cy={s*.52} rx={s*.04} ry={s*.025} fill="#f4a0a0" opacity="0.5" />
      <ellipse cx={cx+s*.18} cy={s*.52} rx={s*.04} ry={s*.025} fill="#f4a0a0" opacity="0.5" />
    </svg>
  );
}

function resizeToBase64(file, maxPx = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function saveBase64ToFirestore(base64) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");
  // Only update if user doc exists (during create profile it gets saved later)
  try {
    await updateDoc(doc(db, "users", user.uid), { photoURL: base64 });
  } catch (e) {
    // Doc doesn't exist yet (new user) — that's fine, CreateProfile saves it
    console.log("User doc not yet created, avatar will be saved on profile submit");
  }
  return base64;
}

export default function AvatarPicker({ currentPhoto, onSave, onClose }) {
  const [mode, setMode] = useState("choose");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [options, setOptions] = useState({
    skin: "#FDDBB4", hair: "#4a3728", hairStyle: "short", eyes: "#1a1a1a", mouth: "smile"
  });
  const fileRef = useRef(null);

  // Safe preview — never use empty string as img src
  const previewSrc = currentPhoto && currentPhoto.length > 10
    ? currentPhoto
    : `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${auth.currentUser?.uid || "user"}`;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError("Max 10MB!"); return; }
    setUploading(true); setError("");
    try {
      const base64 = await resizeToBase64(file, 200);
      await saveBase64ToFirestore(base64);
      onSave(base64);
    } catch (err) {
      console.error(err);
      setError("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  const saveCartoon = async () => {
    setUploading(true); setError("");
    try {
      const svgEl = document.querySelector("#cartoon-preview svg");
      if (!svgEl) throw new Error("Preview not found");
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d");
      await new Promise((res, rej) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, 200, 200); res(); };
        img.onerror = rej;
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });
      const base64 = canvas.toDataURL("image/png", 0.85);
      await saveBase64ToFirestore(base64);
      onSave(base64);
    } catch (err) {
      console.error(err);
      setError("Failed: " + err.message);
    }
    setUploading(false);
  };

  const Swatch = ({ color, selected, onClick }) => (
    <div onClick={onClick} style={{
      width: "28px", height: "28px", borderRadius: "50%", background: color,
      cursor: "pointer", flexShrink: 0,
      border: selected ? "3px solid var(--purple-dark)" : "2px solid var(--border)",
      boxSizing: "border-box", transition: "transform 0.1s ease",
      transform: selected ? "scale(1.15)" : "scale(1)"
    }} />
  );

  const StyleBtn = ({ label, selected, onClick }) => (
    <button onClick={onClick} style={{
      padding: "5px 12px", borderRadius: "20px", cursor: "pointer",
      fontSize: "12px", fontWeight: "600",
      background: selected ? "var(--purple-dark)" : "var(--card)",
      color: selected ? "var(--bg)" : "var(--text)",
      border: `1px solid var(--border)`,
      fontFamily: "Inter, sans-serif", transition: "all 0.15s"
    }}>
      {label}
    </button>
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "20px 20px 0 0",
        padding: "20px", width: "100%", maxWidth: "480px",
        paddingBottom: "40px", maxHeight: "90vh", overflowY: "auto"
      }}>
        <div style={{ width: "36px", height: "4px", background: "var(--border)", borderRadius: "2px", margin: "0 auto 16px" }} />

        <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--text)", marginBottom: "20px", textAlign: "center", fontFamily: "Inter, sans-serif" }}>
          Choose Avatar
        </h3>

        {error && (
          <p style={{ color: "#ed4956", fontSize: "13px", textAlign: "center", marginBottom: "12px", fontFamily: "Inter, sans-serif" }}>
            ⚠️ {error}
          </p>
        )}

        {/* Current photo preview */}
        {mode === "choose" && (
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img src={previewSrc} alt="current avatar" style={{
              width: "80px", height: "80px", borderRadius: "50%",
              objectFit: "cover", border: `3px solid var(--purple-light)`
            }} />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px", fontFamily: "Inter, sans-serif" }}>
              Current avatar
            </p>
          </div>
        )}

        {mode === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => setMode("cartoon")} className="btn-primary">
              🎨 Build Cartoon Avatar
            </button>
            <button onClick={() => fileRef.current.click()} className="btn-secondary">
              📷 Upload Photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
            {uploading && (
              <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", fontFamily: "Inter, sans-serif" }}>
                ⏳ Processing...
              </p>
            )}
            <button onClick={onClose} style={{
              background: "none", border: "none", color: "#ed4956",
              fontSize: "14px", fontWeight: "600", cursor: "pointer",
              fontFamily: "Inter, sans-serif", padding: "8px"
            }}>
              Cancel
            </button>
          </div>
        )}

        {mode === "cartoon" && (
          <div>
            {/* Live preview */}
            <div id="cartoon-preview" style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "100px", height: "100px", borderRadius: "50%",
                margin: "0 auto", overflow: "hidden",
                border: `3px solid var(--purple-dark)`
              }}>
                <CartoonAvatar options={options} size={100} />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px", fontFamily: "Inter, sans-serif" }}>
                Live preview
              </p>
            </div>

            {[
              { label: "Skin tone",  items: SKIN_TONES,   key: "skin",      type: "swatch" },
              { label: "Hair style", items: HAIR_STYLES,  key: "hairStyle", type: "btn"    },
              { label: "Hair color", items: HAIR_COLORS,  key: "hair",      type: "swatch" },
              { label: "Eye color",  items: EYE_COLORS,   key: "eyes",      type: "swatch" },
              { label: "Mouth",      items: MOUTH_STYLES, key: "mouth",     type: "btn"    },
            ].map(section => (
              <div key={section.key} style={{ marginBottom: "16px" }}>
                <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px", fontFamily: "Inter, sans-serif" }}>
                  {section.label}
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {section.items.map(item => (
                    section.type === "swatch"
                      ? <Swatch key={item} color={item} selected={options[section.key] === item} onClick={() => setOptions(p => ({ ...p, [section.key]: item }))} />
                      : <StyleBtn key={item} label={item} selected={options[section.key] === item} onClick={() => setOptions(p => ({ ...p, [section.key]: item }))} />
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={() => setMode("choose")} className="btn-secondary" style={{ flex: 1 }}>
                ← Back
              </button>
              <button onClick={saveCartoon} disabled={uploading} className="btn-primary" style={{ flex: 1 }}>
                {uploading ? "Saving..." : "Save Avatar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
