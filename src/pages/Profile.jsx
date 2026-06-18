import { useEffect, useState } from "react";
import "../App.css";
import { fetchHabitsData } from "../utils/storage";

function Profile({ user }) {
  const [habits, setHabits] = useState([]);
  const [totalCompletions, setTotalCompletions] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const data = await fetchHabitsData(user);
      setHabits(data);
      
      // Calculate completions and streaks
      const completions = data.reduce((acc, h) => acc + (h.history?.length || 0), 0);
      setTotalCompletions(completions);
      
      const activeStreaks = data.map(h => h.Streak || 0);
      const longestStreaks = data.map(h => h.longestStreak || 0);
      const topStreak = data.length > 0 ? Math.max(...activeStreaks, ...longestStreaks) : 0;
      setMaxStreak(topStreak);
    };
    
    loadStats();
  }, [user]);

  // Unique categories count
  const uniqueCategories = new Set(habits.map(h => h.category)).size;

  // Badge list definitions with unlock triggers
  const badges = [
    {
      id: "first_step",
      icon: "🌱",
      name: "First Step",
      desc: "Create at least one habit",
      unlocked: habits.length >= 1
    },
    {
      id: "streak_novice",
      icon: "🔥",
      name: "Streak Novice",
      desc: "Reach a 3-day habit streak",
      unlocked: maxStreak >= 3
    },
    {
      id: "consistency_champ",
      icon: "⚡",
      name: "Consistency Champ",
      desc: "Reach a 7-day habit streak",
      unlocked: maxStreak >= 7
    },
    {
      id: "habit_master",
      icon: "🌟",
      name: "Habit Master",
      desc: "Reach a 14-day habit streak",
      unlocked: maxStreak >= 14
    },
    {
      id: "multi_tasker",
      icon: "💼",
      name: "Multi-Tasker",
      desc: "Track habits in 3+ categories",
      unlocked: uniqueCategories >= 3
    },
    {
      id: "legendary_builder",
      icon: "🏆",
      name: "Legendary Builder",
      desc: "Log 50 total habit completions",
      unlocked: totalCompletions >= 50
    }
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const handleResetData = () => {
    if (window.confirm("CAUTION: Are you sure you want to delete all habits and statistics? This cannot be undone.")) {
      if (user?.uid === "guest") {
        localStorage.removeItem("habit_ai_habits");
        alert("Local guest data cleared successfully.");
      } else {
        alert("Please delete habits individually in your dashboard to remove remote logs.");
      }
      window.location.reload();
    }
  };

  return (
    <div className="profile-container">
      <div className="reminder-header-group">
        <div className="header-title">
          <h1>👤 Profile & Achievements</h1>
          <p>Analyze your personal consistency score and unlock legendary badges.</p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: User details */}
        <div className="profile-card-col">
          <div className="profile-meta-panel glass-panel">
            <div className="profile-avatar-large">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "G"}
            </div>
            <h2>{user?.displayName || "Guest Builder"}</h2>
            <p>{user?.email || "Local storage guest profile"}</p>
            
            <div className="profile-status-badge">
              {user?.uid === "guest" ? "⚡ Local Guest Mode" : "🔒 Synced Account"}
            </div>
            
            <div style={{ marginTop: "24px" }}>
              {user?.uid === "guest" ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  Unga habits iniku local-ah save aagudhu. Log out panni Google login panna batch upload aagum!
                </p>
              ) : (
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  All systems operating normally. Habits and streaks sync continuously with your cloud cloud database.
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="quick-stats-row">
            <div className="quick-stat-box glass-panel">
              <div className="quick-stat-val">{habits.length}</div>
              <div className="quick-stat-lbl">Active Habits</div>
            </div>
            <div className="quick-stat-box glass-panel">
              <div className="quick-stat-val">{maxStreak}</div>
              <div className="quick-stat-lbl">Best Streak</div>
            </div>
          </div>

          <div className="quick-stats-row">
            <div className="quick-stat-box glass-panel">
              <div className="quick-stat-val">{totalCompletions}</div>
              <div className="quick-stat-lbl">Completions</div>
            </div>
            <div className="quick-stat-box glass-panel">
              <div className="quick-stat-val">{unlockedCount}/6</div>
              <div className="quick-stat-lbl">Badges Unlocked</div>
            </div>
          </div>

          {/* Data controls */}
          <div className="glass-panel" style={{ padding: "20px", textAlign: "center" }}>
            <button 
              onClick={handleResetData}
              style={{
                background: "transparent",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--danger)",
                padding: "10px 18px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "600",
                transition: "all var(--transition-fast)"
              }}
              onMouseOver={(e) => {
                e.target.style.background = "rgba(239, 68, 68, 0.1)";
                e.target.style.borderColor = "var(--danger)";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "transparent";
                e.target.style.borderColor = "rgba(239, 68, 68, 0.2)";
              }}
            >
              ⚠️ Reset Account Data
            </button>
          </div>
        </div>

        {/* Right Column: Achievements Cabinet */}
        <div className="badge-cabinet-card glass-panel">
          <h3>🏆 Consistency Badge Cabinet</h3>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "25px", lineHeight: "1.5" }}>
            Badges automatically unlock as you build habits, increase daily streaks, and log completions. Keep pushing your limits!
          </p>

          <div className="badge-grid">
            {badges.map((b) => (
              <div key={b.id} className={`badge-item ${b.unlocked ? "unlocked" : ""}`}>
                <span className="badge-icon">{b.unlocked ? b.icon : "🔒"}</span>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;