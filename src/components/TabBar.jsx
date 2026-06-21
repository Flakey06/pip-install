import { useNavigate, useLocation } from "react-router-dom";

const TABS = [
  {
    path: "/home", label: "Profile",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0f0f0f" : "#8e8e8e"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
  {
    path: "/explore", label: "Explore",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0f0f0f" : "#8e8e8e"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    )
  },
  {
    path: "/groups", label: "Messages",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "#0f0f0f" : "none"} stroke={active ? "#0f0f0f" : "#8e8e8e"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    path: "/friends", label: "Community",
    icon: (active) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "#0f0f0f" : "#8e8e8e"} strokeWidth={active ? "2.5" : "2"} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      borderTop: "1px solid var(--border)",
      display: "flex", justifyContent: "space-around",
      padding: "10px 0 24px",
      zIndex: 100
    }}>
      {TABS.map(tab => {
        const active = location.pathname === tab.path;
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)} style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "4px", background: "none", border: "none",
            cursor: "pointer", padding: "4px 20px",
            position: "relative"
          }}>
            {tab.icon(active)}
            {tab.path === "/groups" && unread > 0 && (
              <span style={{
                position: "absolute", top: "0", right: "10px",
                background: "#ed4956", color: "white",
                borderRadius: "10px", fontSize: "10px",
                fontWeight: "700", padding: "1px 5px",
                minWidth: "16px", textAlign: "center",
                border: "1.5px solid white"
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
