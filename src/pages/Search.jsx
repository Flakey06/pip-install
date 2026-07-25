// file use: search users by name or interest
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import MemberProfile from "../components/MemberProfile";
import TabBar from "../components/TabBar";

export default function Search() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUid, setSelectedUid] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "users"));
      const all = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
      setUsers(all);
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered([]); return; }
    const q = search.toLowerCase().trim();
    setFiltered(users.filter(u =>
      u.username?.toLowerCase().includes(q) ||
      u.major?.toLowerCase().includes(q) ||
      u.interests?.some(i => i.toLowerCase().includes(q))
    ).slice(0, 20));
  }, [search, users]);

  return (
    <div className="page">
      <div className="header" style={{ flexDirection: "column", alignItems: "stretch", gap: "10px", padding: "14px 16px" }}>
        <span className="header-title">Search</span>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, major or interest..."
            autoFocus
          />
        </div>
      </div>

      {!search && (
        <div className="empty-state" style={{ padding: "60px 32px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>🔍</p>
          <p style={{ fontSize: "15px", color: "var(--text)", fontWeight: "600", marginBottom: "4px" }}>Find people</p>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Search by username, major, or shared interests</p>
        </div>
      )}

      {search && loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <div className="loader" />
        </div>
      )}

      {search && !loading && filtered.length === 0 && (
        <div className="empty-state" style={{ padding: "60px 32px" }}>
          <p style={{ fontSize: "14px" }}>No users found for "{search}"</p>
        </div>
      )}

      {filtered.length > 0 && (
        <div style={{ background: "var(--card)", margin: "12px 16px", borderRadius: "14px", border: `1px solid var(--border)`, overflow: "hidden" }}>
          {filtered.map((user, i) => (
            <div key={user.uid}>
              <div className="list-row" onClick={() => setSelectedUid(user.uid)}>
                <img src={user.photoURL} alt={user.username}
                  className="avatar"
                  style={{ width: "46px", height: "46px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: "600", fontSize: "15px", margin: "0 0 2px", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>

                    {user.username}
                    {user.nusVerified && (
                      <span style={{ fontSize: "11px", background: "#1d4ed8", color: "white", padding: "2px 6px", borderRadius: "4px", fontFamily: "Inter, sans-serif", fontWeight: "700" }}>✅ NUS</span>
                    )}
                    {user.profileBadge && (
                      <span>{user.profileBadge === "badge_star" ? "⭐" : user.profileBadge === "badge_fire" ? "🔥" : "👑"}</span>
                    )}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user.major} · {user.interests?.slice(0, 3).join(", ")}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {i < filtered.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      )}

      <TabBar />
      {selectedUid && <MemberProfile uid={selectedUid} onClose={() => setSelectedUid(null)} />}
    </div>
  );
}
