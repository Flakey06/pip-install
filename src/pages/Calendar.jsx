// code's use: personal calendar, aggregates events from ALL groups
import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const navigate = useNavigate();
  const me = auth.currentUser?.uid;

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(query(collection(db, "personalEvents"), where("userId", "==", me)));
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetch();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const eventsOnDate = (dateStr) => events.filter(e => e.date === dateStr);

  const monthEvents = events
    .filter(e => e.date?.startsWith(`${year}-${String(month+1).padStart(2,"0")}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div style={{ minHeight: "100vh", background: "white", paddingBottom: "80px" }}>
      <div className="header">
        <button onClick={() => navigate("/home")} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className="header-title">My Calendar</span>
        <div style={{ width: "20px" }} />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>‹</button>
        <p style={{ fontWeight: "700", fontSize: "16px", fontFamily: "Inter, sans-serif", margin: 0 }}>{MONTHS[month]} {year}</p>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", marginBottom: "4px" }}>
        {DAYS.map(d => (
          <p key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: "600", color: "#8e8e8e", margin: 0, padding: "4px 0", fontFamily: "Inter, sans-serif" }}>{d}</p>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "0 8px", gap: "2px" }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={i} />)}
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
              background: isSelected ? "#0f0f0f" : "transparent"
            }}>
              <p style={{
                fontSize: "14px", fontWeight: isToday ? "700" : "400",
                color: isSelected ? "white" : isToday ? "var(--purple-dark)" : "#0f0f0f",
                margin: 0, fontFamily: "Inter, sans-serif",
                width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: "50%",
                background: isToday && !isSelected ? "var(--purple-light)" : "transparent"
              }}>{day}</p>
              {hasEvents && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: isSelected ? "white" : "var(--purple-dark)", marginTop: "2px" }} />}
            </div>
          );
        })}
      </div>

      <div className="divider" style={{ margin: "12px 0" }} />

      <div style={{ padding: "0 16px" }}>
        {selectedDate ? (
          <>
            <p style={{ fontWeight: "700", fontSize: "15px", fontFamily: "Inter, sans-serif", marginBottom: "12px" }}>
              {selectedDate}
            </p>
            {eventsOnDate(selectedDate).length === 0 ? (
              <p style={{ fontSize: "14px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>No events on this day.</p>
            ) : (
              eventsOnDate(selectedDate).map(event => (
                <div key={event.id} style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "8px", background: "#fafafa" }}>
                  <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 4px", fontFamily: "Inter, sans-serif" }}>{event.title}</p>
                  <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                    🕐 {event.time}{event.location ? ` · ${event.location}` : ""}
                  </p>
                  {event.groupId && (
                    <p style={{ fontSize: "12px", color: "var(--purple-dark)", margin: "4px 0 0", fontFamily: "Inter, sans-serif" }}>
                      From group chat
                    </p>
                  )}
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <p className="section-label" style={{ padding: "0 0 8px" }}>This Month ({monthEvents.length} events)</p>
            {monthEvents.length === 0 ? (
              <p style={{ fontSize: "14px", color: "#8e8e8e", fontFamily: "Inter, sans-serif" }}>
                No events this month. Events from group chats will appear here!
              </p>
            ) : (
              monthEvents.map(event => (
                <div key={event.id} style={{ padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", marginBottom: "8px", background: "#fafafa" }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ textAlign: "center", minWidth: "36px" }}>
                      <p style={{ fontSize: "18px", fontWeight: "700", margin: 0, color: "var(--purple-dark)", fontFamily: "Inter, sans-serif" }}>
                        {parseInt(event.date?.split("-")[2])}
                      </p>
                      <p style={{ fontSize: "10px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                        {MONTHS[parseInt(event.date?.split("-")[1])-1]?.slice(0,3)}
                      </p>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px", fontFamily: "Inter, sans-serif" }}>{event.title}</p>
                      <p style={{ fontSize: "12px", color: "#8e8e8e", margin: 0, fontFamily: "Inter, sans-serif" }}>
                        🕐 {event.time}{event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
