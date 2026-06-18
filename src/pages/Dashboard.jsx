import { useEffect, useState } from "react";
import "../App.css";
import { 
  fetchHabitsData, 
  addHabitData, 
  markHabitDoneData, 
  deleteHabitData 
} from "../utils/storage";

function Dashboard({ user }) {
  const [habits, setHabits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  // Form States
  const [habitName, setHabitName] = useState("");
  const [habitTime, setHabitTime] = useState("08:00");
  const [habitCategory, setHabitCategory] = useState("health");
  const [habitColor, setHabitColor] = useState("violet");

  // Load habits
  const fetchHabits = async () => {
    const list = await fetchHabitsData(user);
    setHabits(list);
  };

  useEffect(() => {
    fetchHabits();
    
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [user]);

  // Periodic Reminder triggers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime =
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

      habits.forEach((habit) => {
        if (habit.time && habit.time === currentTime && !habit.done) {
          // Trigger browser notification only if it hasn't been fired in the last minute
          const lastFiredKey = `notif_fired_${habit.id}_${currentTime}`;
          if (!sessionStorage.getItem(lastFiredKey)) {
            sessionStorage.setItem(lastFiredKey, "true");
            
            const level = getStreakLevel(habit.Streak);
            const quote = getMotivationalQuote(habit.Streak);

            if (Notification.permission === "granted") {
              new Notification(`⏰ Time for ${habit.name}!`, {
                body: `Level: ${level.title}. ${quote}`,
                icon: "/favicon.svg"
              });
            }
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [habits]);

  // Calculations
  const totalHabits = habits.length;
  const completedToday = habits.filter(h => h.done).length;
  const percentComplete = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  
  // Overall streak is the maximum active streak
  const overallStreak = totalHabits > 0 ? Math.max(...habits.map(h => h.Streak || 0)) : 0;
  const totalCompletions = habits.reduce((acc, h) => acc + (h.history?.length || 0), 0);

  // Streak Level logic
  const getStreakLevel = (streak) => {
    if (streak === 0) return { title: "Streak Novice 🌱", color: "#64748b" };
    if (streak <= 2) return { title: "Habit Spark 🔥", color: "#f43f5e" };
    if (streak <= 5) return { title: "Consistency Builder ⚡", color: "#3b82f6" };
    if (streak <= 9) return { title: "Routine Warrior 🛡️", color: "#10b981" };
    if (streak <= 14) return { title: "Habit Master 🌟", color: "#f59e0b" };
    return { title: "Unstoppable Force 👑", color: "#8b5cf6" };
  };

  const currentLevel = getStreakLevel(overallStreak);

  // Motivational quote based on streak
  const getMotivationalQuote = (streak) => {
    if (streak === 0) {
      return "Nala thuvakkam! Let's start building consistency today. Iniku marakama done pannunga! 👍";
    }
    if (streak <= 2) {
      return "Superb start! You are sparking a new habit. Don't let it die, keep pushing! 🚀";
    }
    if (streak <= 5) {
      return "Sema speed! Daily streak rises. Keep the chain going, break panna koodathu! ⚡";
    }
    if (streak <= 9) {
      return "Arumai! Indha streak-a inum perusa valakanum. You are becoming a warrior! 🛡️";
    }
    if (streak <= 14) {
      return "Unbelievable consistency! You are a master of your routines. Absolute class! 🌟";
    }
    return "Mass status unlocked! You are officially UNSTOPPABLE. Habit Deity level achieved! 🏆";
  };

  // Actions
  const handleAddHabit = async () => {
    if (!habitName.trim()) return;

    await addHabitData(user, {
      name: habitName,
      time: habitTime,
      category: habitCategory,
      color: habitColor
    });

    // Reset Form
    setHabitName("");
    setHabitTime("08:00");
    setHabitCategory("health");
    setHabitColor("violet");
    setShowModal(false);
    
    fetchHabits();
  };

  const handleToggleDone = async (habit) => {
    const updated = await markHabitDoneData(user, habit);
    
    // Quick local state update to avoid reloading screen
    setHabits(prev => prev.map(h => h.id === habit.id ? updated : h));
    
    // Update stats after a slight delay
    setTimeout(() => {
      fetchHabits();
    }, 300);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this habit?")) {
      await deleteHabitData(user, id);
      fetchHabits();
    }
  };

  const categories = [
    { id: "health", label: "🌱 Health" },
    { id: "mind", label: "🧠 Mind" },
    { id: "routine", label: "📅 Routine" },
    { id: "work", label: "💼 Work" },
    { id: "fitness", label: "💪 Fitness" }
  ];

  const colors = [
    { id: "violet", hex: "#8b5cf6" },
    { id: "pink", hex: "#ec4899" },
    { id: "cyan", hex: "#06b6d4" },
    { id: "emerald", hex: "#10b981" },
    { id: "amber", hex: "#f59e0b" }
  ];

  return (
    <div className="dashboard-container">
      {/* Header section */}
      <div className="header-section">
        <div className="header-title">
          <h1>Iniku enna plannings? 🎯</h1>
          <p>Welcome back, {user?.displayName || "Builder"}. Let's power up those streaks!</p>
        </div>
        <div className="action-bar">
          <button className="glow-btn" onClick={() => setShowModal(true)}>
            + Create Habit
          </button>
        </div>
      </div>

      {/* Streak Milestone Banner */}
      <div className="milestone-banner glass-panel">
        <div className="milestone-left">
          <span className="milestone-badge-name" style={{ borderColor: currentLevel.color, color: currentLevel.color }}>
            {currentLevel.title}
          </span>
          <h2 className="milestone-title">Overall Streak Status</h2>
          <p className="milestone-subtitle">
            {getMotivationalQuote(overallStreak)}
          </p>
        </div>
        <div className="milestone-right">
          <div className="overall-streak-counter">
            <div className="overall-streak-val">{overallStreak}</div>
            <div className="overall-streak-lbl">Days Streak</div>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="dashboard-grid">
        {/* Left Side: Habits list */}
        <div className="habits-section">
          <div className="habits-section-header">
            <h2>Today's Routine ({completedToday}/{totalHabits})</h2>
          </div>

          {totalHabits === 0 ? (
            <div className="empty-state glass-panel">
              <div className="empty-state-icon">🚀</div>
              <h3>No habits created yet</h3>
              <p>Habits shape your destiny. Let's create your first one right now!</p>
              <button className="glow-btn" onClick={() => setShowModal(true)}>
                + Create Habit
              </button>
            </div>
          ) : (
            <div className="habit-list">
              {habits.map((habit) => (
                <div 
                  key={habit.id} 
                  className={`habit-card glass-panel ${habit.done ? "completed" : ""}`}
                  style={{ borderLeft: `4px solid ${colors.find(c => c.id === habit.color)?.hex || "var(--primary)"}` }}
                >
                  <div className="habit-info-group">
                    <div 
                      className={`habit-status-checkbox ${habit.done ? "checked" : ""}`}
                      onClick={() => handleToggleDone(habit)}
                    >
                      {habit.done && "✓"}
                    </div>
                    <div className="habit-details">
                      <span className="habit-name-txt">{habit.name}</span>
                      <div className="habit-tags">
                        <span className="tag tag-time">⏰ {habit.time}</span>
                        <span className="tag tag-category">
                          {categories.find(c => c.id === habit.category)?.label || habit.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="habit-actions-group">
                    <div className={`habit-streak-display ${habit.Streak >= 10 ? "high-streak" : ""}`}>
                      <span>🔥</span>
                      <span className="habit-streak-val-card">{habit.Streak} days</span>
                    </div>
                    <button className="delete-habit-btn" onClick={() => handleDelete(habit.id)}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Stats Widget */}
        <div className="sidebar-widgets">
          <div className="widget-card glass-panel">
            <h3>Completion Progress</h3>
            <div className="progress-stats-box">
              <div className="progress-metric">
                <span>Today's Target</span>
                <span className="progress-metric-value">{percentComplete}% Done</span>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${percentComplete}%` }}></div>
              </div>
              <div className="progress-metric" style={{ marginTop: "10px" }}>
                <span>Total Completions</span>
                <span className="progress-metric-value" style={{ color: "var(--accent)" }}>{totalCompletions} times</span>
              </div>
            </div>
          </div>

          <div className="widget-card glass-panel" style={{ background: "rgba(139, 92, 246, 0.04)" }}>
            <h3>AI Quick Tip 💡</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
              {overallStreak > 0 
                ? `Massive respect! You are on a ${overallStreak}-day streak. Studies show that executing your habits at the EXACT same time (${habits[0]?.time || "08:00"}) reduces decision fatigue by up to 40%.`
                : "Welcome! To build habits easily, try 'habit stacking' — tie your new habit (e.g. Exercise) right after an existing routine (e.g. Morning Tea)."}
            </p>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h2>Create New Habit</h2>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Habit Name</label>
                <input 
                  type="text" 
                  className="input-element" 
                  placeholder="Ex: Coding, Workout, Reading..." 
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Reminder Time</label>
                <input 
                  type="time" 
                  className="input-element" 
                  value={habitTime}
                  onChange={(e) => setHabitTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <div className="categories-selector">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className={`category-option ${habitCategory === cat.id ? "selected" : ""}`}
                      onClick={() => setHabitCategory(cat.id)}
                    >
                      {cat.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Theme Color</label>
                <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                  {colors.map((c) => (
                    <div 
                      key={c.id} 
                      onClick={() => setHabitColor(c.id)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        backgroundColor: c.hex,
                        cursor: "pointer",
                        border: habitColor === c.id ? "3px solid white" : "1px solid rgba(255,255,255,0.2)",
                        transform: habitColor === c.id ? "scale(1.1)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="glow-btn" onClick={handleAddHabit}>Add Habit</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;