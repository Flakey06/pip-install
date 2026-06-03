import { useTheme, THEMES } from "../hooks/useTheme";

export default function ThemePicker({ onClose }) {
  const { themeId, setTheme } = useTheme();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.45)", zIndex: 400,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      animation: "fadeIn 0.2s ease"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)",
        borderRadius: "24px 24px 0 0",
        padding: "24px 24px 48px",
        width: "100%", maxWidth: "480px",
        border: "1.5px solid var(--border-sketch)",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
        animation: "fadeUp 0.3s ease"
      }}>
        {/* Handle */}
        <div style={{ width: "40px", height: "4px", background: "var(--border-sketch)", borderRadius: "2px", margin: "0 auto 20px" }} />

        <h3 className="display-font" style={{ fontSize: "22px", color: "var(--text)", marginBottom: "4px" }}>
          Pick your vibe 🎨
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
          Changes background, buttons, tags — everything!
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {THEMES.map(theme => {
            const isSelected = themeId === theme.id;
            const { h, s, dark } = theme;
            return (
              <button key={theme.id} onClick={() => setTheme(theme.id)} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px", borderRadius: "14px",
                border: isSelected
                  ? `2px solid hsl(${h}, ${s-10}%, ${dark}%)`
                  : "1.5px solid var(--border-sketch)",
                background: isSelected
                  ? `hsl(${h}, ${s}%, 94%)`
                  : "rgba(255,255,255,0.8)",
                cursor: "pointer",
                transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                boxShadow: isSelected
                  ? `3px 3px 0px hsl(${h}, ${s-10}%, ${dark}%)`
                  : "2px 2px 0px var(--border)",
                transform: isSelected ? "translateY(-2px)" : "none",
                fontFamily: "'Plus Jakarta Sans', sans-serif"
              }}>
                {/* Swatch */}
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, hsl(${h},${s}%,65%), hsl(${h},${s-10}%,${dark}%))`,
                  boxShadow: `2px 2px 0px hsl(${h},${s-10}%,${dark-8}%)`,
                  border: "2px solid white"
                }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{
                    margin: 0, fontWeight: "700", fontSize: "13px",
                    color: isSelected ? `hsl(${h}, ${s-10}%, ${dark}%)` : "var(--text)"
                  }}>
                    {theme.emoji} {theme.label}
                  </p>
                  {isSelected && (
                    <p style={{ margin: 0, fontSize: "11px", color: `hsl(${h}, 50%, 55%)` }}>
                      ✓ Active
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button className="btn-primary" onClick={onClose} style={{ fontSize: "15px" }}>
          Done ✅
        </button>
      </div>
    </div>
  );
}
