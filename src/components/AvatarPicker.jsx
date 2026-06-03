import { useState, useRef } from "react";
import { auth, storage, db } from "../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

const SKIN_TONES = ["#FDDBB4", "#F5CBA7", "#E59866", "#CA9E67", "#8D5524", "#4A2912"];
const HAIR_COLORS = ["#1a1a1a", "#4a3728", "#8B4513", "#DAA520", "#FF6B6B", "#9B59B6", "#FFFFFF"];
const HAIR_STYLES = ["short", "long", "curly", "bun", "none"];
const EYE_COLORS = ["#1a1a1a", "#4169E1", "#228B22", "#8B4513", "#708090"];
const MOUTH_STYLES = ["smile", "grin", "neutral", "smirk"];

function CartoonAvatar({ options, size = 80 }) {
  const { skin, hair, hairStyle, eyes, mouth } = options;
  const s = size;
  const cx = s / 2;

  const hairPaths = {
    short: `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} Q${cx+s*.3} ${s*.22} ${cx} ${s*.18} Q${cx-s*.3} ${s*.22} ${cx-s*.28} ${s*.38}Z`,
    long: `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} L${cx+s*.32} ${s*.75} Q${cx+s*.28} ${s*.8} ${cx+s*.22} ${s*.7} L${cx-s*.22} ${s*.7} Q${cx-s*.28} ${s*.8} ${cx-s*.32} ${s*.75}Z`,
    curly: `M${cx-s*.28} ${s*.38} Q${cx-s*.35} ${s*.1} ${cx} ${s*.12} Q${cx+s*.35} ${s*.1} ${cx+s*.28} ${s*.38} Q${cx+s*.38} ${s*.2} ${cx+s*.15} ${s*.15} Q${cx} ${s*.08} ${cx-s*.15} ${s*.15} Q${cx-s*.38} ${s*.2} ${cx-s*.28} ${s*.38}Z`,
    bun: `M${cx-s*.28} ${s*.38} Q${cx} ${s*.05} ${cx+s*.28} ${s*.38} Q${cx+s*.3} ${s*.22} ${cx} ${s*.18} Q${cx-s*.3} ${s*.22} ${cx-s*.28} ${s*.38}Z M${cx-s*.1} ${s*.15} Q${cx} ${s*.02} ${cx+s*.1} ${s*.15} Q${cx} ${s*.22} ${cx-s*.1} ${s*.15}Z`,
    none: ""
  };

  const mouthPaths = {
    smile: `M${cx-s*.12} ${s*.62} Q${cx} ${s*.72} ${cx+s*.12} ${s*.62}`,
    grin: `M${cx-s*.14} ${s*.61} Q${cx} ${s*.74} ${cx+s*.14} ${s*.61} L${cx+s*.14} ${s*.64} Q${cx} ${s*.76} ${cx-s*.14} ${s*.64}Z`,
    neutral: `M${cx-s*.1} ${s*.65} L${cx+s*.1} ${s*.65}`,
    smirk: `M${cx-s*.08} ${s*.65} Q${cx+s*.06} ${s*.6} ${cx+s*.12} ${s*.63}`
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

function AvatarPicker({ currentPhoto, onSave, onClose }) {
  const [mode, setMode] = useState("choose");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [cartoonOptions, setCartoonOptions] = useState({
    skin: "#FDDBB4", hair: "#4a3728", hairStyle: "short",
    eyes: "#1a1a1a", mouth: "smile"
  });
  const fileRef = useRef(null);

  const uploadToStorage = async (blob, filename) => {
    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in!");
    const storageRef = ref(storage, `avatars/${user.uid}/${filename}`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    await updateDoc(doc(db, "users", user.uid), { photoURL: url });
    return url;
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large! Max 5MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const url = await uploadToStorage(file, "photo");
      onSave(url);
    } catch (err) {
      console.error("Upload error:", err);
      setError(`Upload failed: ${err.message}`);
    }
    setUploading(false);
  };

  const saveCartoon = async () => {
    setUploading(true);
    setError("");
    try {
      const svgEl = document.querySelector("#cartoon-preview svg");
      if (!svgEl) throw new Error("SVG not found");
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext("2d");

      await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0, 200, 200); resolve(); };
        img.onerror = reject;
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      const url = await uploadToStorage(blob, "cartoon");
      onSave(url);
    } catch (err) {
      console.error("Cartoon save error:", err);
      setError(`Failed to save: ${err.message}`);
    }
    setUploading(false);
  };

  const Swatch = ({ color, selected, onClick }) => (
    <div onClick={onClick} style={{
      width: "28px", height: "28px", borderRadius: "50%",
      background: color, cursor: "pointer", flexShrink: 0,
      border: selected ? "3px solid var(--purple-dark)" : "2px solid rgba(0,0,0,0.1)",
      boxShadow: selected ? "0 0 0 2px var(--purple-light)" : "none",
      transition: "all 0.15s ease"
    }} />
  );

  const StyleBtn = ({ label, selected, onClick }) => (
    <button onClick={onClick} style={{
      padding: "6px 14px", borderRadius: "20px", cursor: "pointer",
      fontSize: "13px", fontWeight: "700",
      background: selected ? "var(--purple-dark)" : "white",
      color: selected ? "white" : "var(--purple-dark)",
      border: "2px solid var(--border-sketch)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      transition: "all 0.15s ease",
      boxShadow: selected ? "2px 2px 0px var(--purple-dark)" : "none"
    }}>
      {label}
    </button>
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 300,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: "24px 24px 0 0",
        padding: "24px", width: "100%", maxWidth: "480px",
        paddingBottom: "40px", maxHeight: "90vh", overflowY: "auto",
        border: "1.5px solid var(--border-sketch)"
      }}>
        <div style={{ width: "40px", height: "4px", background: "var(--border-sketch)", borderRadius: "2px", margin: "0 auto 20px" }} />

        <h3 className="display-font" style={{ fontSize: "20px", color: "var(--text)", marginBottom: "20px", textAlign: "center" }}>
          Choose your avatar 🎨
        </h3>

        {error && (
          <div style={{
            padding: "10px 14px", borderRadius: "10px", marginBottom: "14px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            color: "#DC2626", fontSize: "13px", fontWeight: "600"
          }}>
            ⚠️ {error}
          </div>
        )}

        {mode === "choose" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button className="btn-primary" onClick={() => setMode("cartoon")}>
              🎨 Build a cartoon avatar
            </button>
            <button className="btn-secondary" onClick={() => fileRef.current.click()}>
              📷 Upload a photo
            </button>
            <input
              ref={fileRef} type="file" accept="image/*"
              style={{ display: "none" }} onChange={handleUpload}
            />
            {uploading && (
              <div style={{ textAlign: "center", color: "var(--purple-dark)", fontWeight: "600", padding: "10px" }}>
                ⏳ Uploading...
              </div>
            )}
          </div>
        )}

        {mode === "cartoon" && (
          <div>
            {/* Preview */}
            <div id="cartoon-preview" style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{
                width: "100px", height: "100px", borderRadius: "50%",
                margin: "0 auto", overflow: "hidden",
                border: "3px solid var(--purple-dark)",
                boxShadow: "4px 4px 0px var(--border-sketch)"
              }}>
                <CartoonAvatar options={cartoonOptions} size={100} />
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                Live preview
              </p>
            </div>

            {/* Skin tone */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Skin tone</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {SKIN_TONES.map(c => (
                  <Swatch key={c} color={c} selected={cartoonOptions.skin === c}
                    onClick={() => setCartoonOptions(p => ({ ...p, skin: c }))} />
                ))}
              </div>
            </div>

            {/* Hair style */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Hair style</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {HAIR_STYLES.map(s => (
                  <StyleBtn key={s} label={s} selected={cartoonOptions.hairStyle === s}
                    onClick={() => setCartoonOptions(p => ({ ...p, hairStyle: s }))} />
                ))}
              </div>
            </div>

            {/* Hair color */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Hair color</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {HAIR_COLORS.map(c => (
                  <Swatch key={c} color={c} selected={cartoonOptions.hair === c}
                    onClick={() => setCartoonOptions(p => ({ ...p, hair: c }))} />
                ))}
              </div>
            </div>

            {/* Eye color */}
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Eye color</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {EYE_COLORS.map(c => (
                  <Swatch key={c} color={c} selected={cartoonOptions.eyes === c}
                    onClick={() => setCartoonOptions(p => ({ ...p, eyes: c }))} />
                ))}
              </div>
            </div>

            {/* Mouth */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontWeight: "700", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Mouth</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {MOUTH_STYLES.map(s => (
                  <StyleBtn key={s} label={s} selected={cartoonOptions.mouth === s}
                    onClick={() => setCartoonOptions(p => ({ ...p, mouth: s }))} />
                ))}
              </div>
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "10px", marginBottom: "14px",
                background: "rgba(239,68,68,0.08)", color: "#DC2626",
                fontSize: "13px", fontWeight: "600"
              }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-secondary" onClick={() => setMode("choose")} style={{ flex: 1 }}>
                ← Back
              </button>
              <button className="btn-primary" onClick={saveCartoon} disabled={uploading} style={{ flex: 1 }}>
                {uploading ? "Saving..." : "Save Avatar ✅"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AvatarPicker;
