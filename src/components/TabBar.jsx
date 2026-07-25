// code use: bottom navigation bar — Profile/Search/Messages/Explore/Community
import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  { path: "/home", label: "Profile",
    icon: (active) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--purple-dark)" : "var(--text-muted)"} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
  { path: "/search", label: "Search",
    icon: (active) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--purple-dark)" : "var(--text-muted)"} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    )
  },
  { path: "/groups", label: "Messages",
    icon: (active) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill={active ? "var(--purple-dark)" : "none"} stroke={active ? "var(--purple-dark)" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  { path: "/explore", label: "Explore",
    icon: (active) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--purple-dark)" : "var(--text-muted)"} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
      </svg>
    )
  },
  { path: "/luma-events", label: "Open Invite",
    icon: (active) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--purple-dark)" : "var(--text-muted)"} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </svg>
    )
  },
];

export default function TabBar({ unread = 0 }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "var(--bg)", borderTop: `1px solid var(--border)`,
      display: "flex", justifyContent: "space-around",
      padding: "8px 0 22px", zIndex: 100
    }}>
      {TABS.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "3px", background: "none", border: "none",
            cursor: "pointer", padding: "4px 12px", position: "relative"
          }}>
            {tab.icon(active)}
            <span style={{
              fontSize: "10px",
              fontWeight: active ? "700" : "500",
              color: active ? "var(--purple-dark)" : "var(--text-muted)",
              fontFamily: "Inter, sans-serif"
            }}>
              {tab.label}
            </span>
            {tab.path === "/groups" && unread > 0 && (
              <span style={{
                position: "absolute", top: 0, right: "4px",
                background: "#ed4956", color: "white",
                borderRadius: "10px", fontSize: "9px",
                fontWeight: "700", padding: "1px 5px",
                border: `1.5px solid var(--bg)`
              }}>
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
