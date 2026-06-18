import { useEffect, useState } from "react";
import "../App.css";
import { fetchHabitsData, updateHabitFieldData } from "../utils/storage";

function Reminder({ user }) {
  const [habits, setHabits] = useState([]);
  const [notifPermission, setNotifPermission] = useState("default");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Load habits and permission status
  const loadData = async () => {
    const data = await fetchHabitsData(user);
    setHabits(data);
    
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  };

  useEffect(() => {
    loadData();
    const soundPref = localStorage.getItem("habit_sound_enabled") !== "false";
    setSoundEnabled(soundPref);
  }, [user]);

  // Request browser notifications permission
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  // Sound chime utility
  const playChime = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav");
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.log("Audio play blocked by browser policies.");
    }
  };

  // Test notification function
  const triggerTestNotification = () => {
    playChime();
    
    if (Notification.permission === "granted") {
      new Notification("⏰ Habit AI test alert!", {
        body: "Habit alerts are active. Keep smashing those daily goals! 🔥",
        icon: "/favicon.svg"
      });
    } else {
      alert("Notification permission is not granted yet. Chime sound played successfully!");
    }
  };

  // Handle reminder time edit
  const handleTimeChange = async (habitId, newTime) => {
    // Update local state first for instant responsiveness
    setHabits(prev => prev.map(h => h.id === habitId ? { ...h, time: newTime } : h));
    
    // Save to DB
    await updateHabitFieldData(user, habitId, { time: newTime });
  };

  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem("habit_sound_enabled", String(nextVal));
    if (nextVal) {
      playChime();
    }
  };

  return (
    <div className="reminders-container">
      <div className="reminder-header-group">
        <div className="header-title">
          <h1>⏰ Reminders Control Center</h1>
          <p>Schedule your routine, configure notifications, and test chimes.</p>
        </div>
      </div>

      {/* Instructions */}
      <div className="reminder-instructions glass-panel">
        <h4>How do Reminders work?</h4>
        <p>
          Habit AI checks your scheduled times in the background. When the clock hits the exact minute, 
          a desktop alert will be triggered along with a motivational message corresponding to your current streak!
        </p>
      </div>

      {/* Notification Banner */}
      <div className="permission-request-banner glass-panel" style={{ 
        borderLeft: notifPermission === "granted" ? "4px solid var(--success)" : "4px solid var(--warning)" 
      }}>
        <div className="permission-banner-txt">
          <h3>
            {notifPermission === "granted" 
              ? "Browser Notifications Active ✅" 
              : notifPermission === "denied" 
              ? "Notifications Blocked ❌" 
              : "Allow Desktop Alerts 🔔"}
          </h3>
          <p>
            {notifPermission === "granted"
              ? "You are set! Alerts will fire automatically for active habits."
              : notifPermission === "denied"
              ? "Please enable site notifications in your browser's address bar settings."
              : "We need notification permission to send reminders for your daily habits."}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {notifPermission !== "granted" && (
            <button className="glow-btn" onClick={requestPermission}>
              Enable Alerts
            </button>
          )}
          <button className="btn-secondary" onClick={triggerTestNotification}>
            Test System
          </button>
        </div>
      </div>

      {/* Global Sound Toggles */}
      <div className="glass-panel" style={{ padding: "20px 25px", marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h4 style={{ fontWeight: "600" }}>System Sound Chime</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>Play a soft ding sound when notifications are fired.</p>
        </div>
        <button 
          onClick={toggleSound}
          style={{
            padding: "8px 18px",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            background: soundEnabled ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.03)",
            borderColor: soundEnabled ? "var(--success)" : "var(--card-border)",
            color: soundEnabled ? "#34d399" : "var(--text-muted)",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.85rem"
          }}
        >
          {soundEnabled ? "🔊 Chime ON" : "🔇 Chime MUTED"}
        </button>
      </div>

      {/* Habit reminder timings list */}
      <h2 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "16px", fontFamily: "var(--font-display)" }}>
        Habit Timings ({habits.length})
      </h2>

      {habits.length === 0 ? (
        <div className="empty-state glass-panel">
          <p>No habits to schedule. Add habits in the dashboard first! 🚀</p>
        </div>
      ) : (
        <div className="reminder-list-box">
          {habits.map((habit) => (
            <div key={habit.id} className="reminder-item-row glass-panel">
              <div className="reminder-item-info">
                <span className="reminder-time-icon">⏰</span>
                <div className="reminder-item-details">
                  <h4>{habit.name}</h4>
                  <p>Category: <span style={{ textTransform: "capitalize", color: "var(--text-main)" }}>{habit.category}</span></p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>EDIT TIME:</label>
                <input 
                  type="time" 
                  value={habit.time}
                  onChange={(e) => handleTimeChange(habit.id, e.target.value)}
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--card-border)",
                    color: "var(--text-main)",
                    fontFamily: "var(--font-display)",
                    fontSize: "0.95rem",
                    fontWeight: "700",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    outline: "none"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Reminder;