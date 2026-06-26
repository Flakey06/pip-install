// code's use: uer-group event calendar, add/view/delete hangouts
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function GroupCalendar() {
  const { groupId } = useParams();
  const [events, setEvents] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigate = useNavigate();
  const me = auth.currentUser?.uid;

  useEffect(() => { fetchEvents(); }, [groupId]);

  const fetchEvents = async () => {
    const snap = await getDocs(query(collection(db, "groupEvents"), where("groupId", "==", groupId)));
    setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleAddEvent = async () => {
    if (!title.trim() || !selectedDate) { alert("Add a title and select a date!"); return; }
    setSaving(true);
    await addDoc(collection(db, "groupEvents"), {
      groupId, title: title.trim(), date: selectedDate,
      time, location, note, createdBy: me, createdAt: serverTimestamp()
    });

    await addDoc(collection(db, "personalEvents"), {
      userId: me, title: `[Group] ${title.trim()}`, date: selectedDate,
      time, location, note, groupId, createdAt: serverTimestamp()
    });
    setTitle(""); setTime("12:00"); setLocation(""); setNote("");
    setShowAdd(false); setSelectedDate(null);
    await fetchEvents();
    setSaving(false);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Remove this event?")) return;
    await deleteDoc(doc(db, "groupEvents", eventId));
    await fetchEvents();
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventsOnDate = (dateStr) => events.filter(e => e.date === dateStr);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${parseInt(d)} ${MONTHS[parseInt(m)-1]} ${y}`;
  };

  const monthEvents = events
    .filter(e => e.date?.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ minHeight: "100vh", background: "white", paddingBottom: "40px" }}>
      <div className="header">
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">Group Calendar</span>
        <button className="text-btn" onClick={() => setShowAdd(true)}>+ Add</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#0f0f0f" }}>‹</button>
        <p style={{ fontWeight: "700", fontSize: "16px", fontFamily: "Inter, sans-serif", margin: 0 }}>
          {MONTHS[month]} {year}
        </p>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#0f0f0f" }}>›</button>
      </div>


      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", marginBottom: "4px" }}>
        {DAYS.map(d => (
          <p key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#8e8e8e", margin: 0, padding: "4px 0", fontFamily: "Inter, sans-serif" }}>
            {d}
          </p>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", gap: "2px" }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
          const isSelected = selectedDate === dateStr;
          const hasEvents = eventsOnDate(dateStr).length > 0;

          return (
            <div key={day} onClick={() => setSelectedDate(isSelected ? null : dateStr)} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "6px 2px", cursor: "pointer", borderRadius: "8px",
              background: isSelected ? "#0f0f0f" : "transparent",
              transition: "background 0.15s"
            }}>
              <p style={{
                fontSize: "14px", fontWeight: isToday ? "700" : "400",
                color: isSelected ? "white" : isToday ? "var(--purple-dark)" : "#0f0f0f",
                margin: 0, fontFamily: "Inter, sans-serif",
                width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%",
                background: isToday && !isSelected ? "var(--purple-light)" : "transparent"
              }}>
                {day}
              </p>
              {hasEvents && (
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: isSelected ? "white" : "var(--purple-dark)", marginTop: "2px" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="divider" style={{ margin: "12px 0" }} />

      {/* to choose the dates */}
      {selectedDate && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px", fontFamily: "Inter, sans-serif", margin: 0 }}>
              {formatDate(selectedDate)}
            </p>
            <button className="text-btn" onClick={() => { setShowAdd(true); }}>+ Event</button>
          </div>
          {eventsOnDate(selectedDate).length === 0 ? (
            <p style={{ fontSize: "14px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>No events — add one!</p>
          ) : (
            eventsOnDate(selectedDate).map(event => (
              <EventCard key={event.id} event={event} onDelete={() => handleDelete(event.id)} isOwner={event.createdBy === me} />
            ))
          )}
        </div>
      )}

      {/* overview of months events */}
      {!selectedDate && monthEvents.length > 0 && (
        <div style={{ padding: "0 16px" }}>
          <p className="section-label" style={{ padding: "0 0 8px" }}>This Month</p>
          {monthEvents.map(event => (
            <EventCard key={event.id} event={event} onDelete={() => handleDelete(event.id)} isOwner={event.createdBy === me} />
          ))}
        </div>
      )}


      {showAdd && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 300,
          display: "flex", alignItems: "flex-end", justifyContent: "center"
        }} onClick={() => setShowAdd(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: "white", borderRadius: "16px 16px 0 0",
            padding: "20px", width: "100%", maxWidth: "480px",
            paddingBottom: "40px", maxHeight: "85vh", overflowY: "auto"
          }}>
            <div style={{ width: "36px", height: "4px", background: "#dbdbdb", borderRadius: "2px", margin: "0 auto 16px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <p style={{ fontWeight: "700", fontSize: "17px", fontFamily: "Inter, sans-serif", margin: 0 }}>New Event</p>
              <button className="text-btn" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>

            {[
              { label: "Title *", value: title, set: setTitle, placeholder: "e.g. Basketball at UTown" },
              { label: "Location", value: location, set: setLocation, placeholder: "e.g. UTown Sports Hall" },
              { label: "Notes", value: note, set: setNote, placeholder: "Any extra details..." },
            ].map(field => (
              <div key={field.label} style={{ marginBottom: "16px" }}>
                <label className="input-label">{field.label}</label>
                <input className="input-underline" value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} />
              </div>
            ))}

            <div style={{ marginBottom: "16px" }}>
              <label className="input-label">Date *</label>
              <input type="date" className="input-underline"
                value={selectedDate || ""}
                onChange={e => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label className="input-label">Time</label>
              <input type="time" className="input-underline" value={time} onChange={e => setTime(e.target.value)} />
            </div>

            <div style={{
              padding: "10px 12px", borderRadius: "8px",
              background: "#fafafa", border: "1px solid var(--border)",
              marginBottom: "16px"
            }}>
              <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                📅 This event will appear in the group calendar and your personal calendar.
              </p>
            </div>

            <button className="btn-primary" onClick={handleAddEvent} disabled={saving}>
              {saving ? "Saving..." : "Add to Calendar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event, onDelete, isOwner }) {
  return (
    <div style={{
      padding: "12px", borderRadius: "10px",
      border: "1px solid var(--border)", marginBottom: "8px",
      background: "#fafafa"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>
            {event.title}
          </p>
          <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
            🕐 {event.time}{event.location ? ` · 📍 ${event.location}` : ""}
          </p>
          {event.note && (
            <p style={{ fontSize: "13px", color: "#8e8e8e", margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>
              {event.note}
            </p>
          )}
        </div>
        {isOwner && (
          <button onClick={onDelete} style={{ background: "none", border: "none", color: "#ed4956", fontSize: "18px", cursor: "pointer", padding: "0 0 0 8px" }}>
            ×
          </button>
        )}
      </div>
    </div>
  );
}
