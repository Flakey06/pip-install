import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, arrayUnion, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import TabBar from "../components/TabBar";

export default function LumaEvents() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [when, setWhen] = useState("");
  const [historyForAll, setHistoryForAll] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState("");

  useEffect(() => {
    const q = query(collection(db, "openInvites"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setInvites(snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleCreateInvite = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (!title.trim()) return;

    const parsedMax = parseInt(maxAttendees, 10);
    const cap = Number.isFinite(parsedMax) && parsedMax >= 2 ? parsedMax : null;

    setSubmitting(true);
    try {
      const groupRef = await addDoc(collection(db, "groups"), {
        name: title.trim(),
        members: [auth.currentUser.uid],
        memberCount: 1,
        sharedInterests: [title.trim().toLowerCase()],
        adminId: auth.currentUser.uid,
        type: "openInvite",
        createdAt: serverTimestamp(),
        historyForAll,
        maxAttendees: cap,
        memberJoinedAt: { [auth.currentUser.uid]: Date.now() },
      });

      await addDoc(collection(db, "openInvites"), {
        title: title.trim(),
        details: details.trim(),
        location: location.trim(),
        when: when.trim(),
        createdBy: auth.currentUser.uid,
        createdByName: auth.currentUser.displayName || "Someone",
        createdAt: serverTimestamp(),
        attendees: [auth.currentUser.uid],
        groupId: groupRef.id,
        maxAttendees: cap,
      });

      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        openInviteGroups: arrayUnion(groupRef.id),
      });

      setTitle("");
      setDetails("");
      setLocation("");
      setWhen("");
      setHistoryForAll(false);
      setMaxAttendees("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinInvite = async (invite, attendees = []) => {
    if (!auth.currentUser) return;
    if (attendees.includes(auth.currentUser.uid)) return;
    if (invite.maxAttendees && attendees.length >= invite.maxAttendees) return;

    const joinedAt = Date.now();
    await updateDoc(doc(db, "openInvites", invite.id), {
      attendees: arrayUnion(auth.currentUser.uid),
    });

    if (invite.groupId) {
      await updateDoc(doc(db, "groups", invite.groupId), {
        members: arrayUnion(auth.currentUser.uid),
        memberCount: (attendees.length || 0) + 1,
        [`memberJoinedAt.${auth.currentUser.uid}`]: joinedAt,
      });
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        openInviteGroups: arrayUnion(invite.groupId),
      });
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "120px" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="header-title">Open invites</span>
        <div style={{ width: "20px" }} />
      </div>

      <div style={{ margin: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setActiveTab("create")} style={{ flex: 1, padding: "10px 12px", borderRadius: "999px", border: activeTab === "create" ? "none" : "1px solid var(--border)", background: activeTab === "create" ? "var(--purple-dark)" : "var(--card)", color: activeTab === "create" ? "white" : "var(--text)", fontWeight: "700" }}>
            Create casual invite
          </button>
          <button onClick={() => setActiveTab("join")} style={{ flex: 1, padding: "10px 12px", borderRadius: "999px", border: activeTab === "join" ? "none" : "1px solid var(--border)", background: activeTab === "join" ? "var(--purple-dark)" : "var(--card)", color: activeTab === "join" ? "white" : "var(--text)", fontWeight: "700" }}>
            Join an open invite
          </button>
        </div>

        {activeTab === "create" ? (
          <form onSubmit={handleCreateInvite} style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px", background: "var(--card)", borderRadius: "14px", border: "1px solid var(--border)" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What are you planning?" required style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }} />
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add a quick note" rows="3" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", resize: "vertical" }} />
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location or meetup spot" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }} />
            <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="When? e.g. Tonight, 8pm" style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }} />

            <input
              type="number"
              min="2"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Max people (optional, leave blank for no limit)"
              style={{ padding: "12px 14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--text)" }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 2px", fontSize: "13px", color: "var(--text)", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={historyForAll}
                onChange={(e) => setHistoryForAll(e.target.checked)}
                style={{ width: "16px", height: "16px" }}
              />
              Let new members see full chat history
            </label>

            <button type="submit" disabled={submitting} style={{ padding: "12px", borderRadius: "12px", border: "none", background: "var(--purple-dark)", color: "white", fontWeight: "700", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.8 : 1 }}>
              {submitting ? "Posting..." : "Post invite"}
            </button>
          </form>
        ) : (
          <>
            {loading && <div style={{ padding: "16px", background: "var(--card)", borderRadius: "14px", border: "1px solid var(--border)" }}>Loading invites…</div>}

            {!loading && invites.length === 0 && (
              <div style={{ padding: "16px", background: "var(--card)", borderRadius: "14px", border: "1px solid var(--border)" }}>
                No open invites yet. Someone will post one soon.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {invites.map((invite) => {
                const attendees = Array.isArray(invite.attendees) ? invite.attendees : [];
                const joined = attendees.includes(auth.currentUser?.uid);
                const isFull = !!invite.maxAttendees && attendees.length >= invite.maxAttendees;
                return (
                  <div key={invite.id} style={{ padding: "16px", borderRadius: "14px", border: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--text)" }}>{invite.title}</p>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {attendees.length}{invite.maxAttendees ? `/${invite.maxAttendees}` : ""} going
                      </span>
                    </div>
                    {invite.details && <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>{invite.details}</p>}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                      {invite.location && <span>📍 {invite.location}</span>}
                      {invite.when && <span>🕒 {invite.when}</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>Hosted by {invite.createdByName || "someone"}</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <button onClick={() => handleJoinInvite(invite, attendees)} disabled={joined || isFull} style={{ padding: "8px 12px", borderRadius: "999px", border: "none", background: (joined || isFull) ? "var(--border)" : "var(--purple-dark)", color: (joined || isFull) ? "var(--text)" : "white", cursor: (joined || isFull) ? "default" : "pointer", fontWeight: "700" }}>
                        {joined ? "You’re in" : isFull ? "Full" : "Join invite"}
                      </button>
                      {invite.groupId && joined && (
                        <button onClick={() => navigate(`/chat/${invite.groupId}`)} style={{ padding: "8px 12px", borderRadius: "999px", border: "1px solid var(--border)", background: "var(--card)", color: "var(--text)", fontWeight: "700" }}>
                          Open chat
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <TabBar />
    </div>
  );
}