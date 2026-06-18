import { NavLink } from "react-router-dom";
import "../App.css";

function Navbar({ user, handleLogout }) {
  // Get first letter of display name for default avatar
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    return "G";
  };

  return (
    <nav className="navbar-sidebar">
      <div>
        <div className="brand">
          <span className="nav-icon">🚀</span>
          <span>Habit AI</span>
        </div>

        <div className="nav-links">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/reminder" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">⏰</span>
            <span>Reminders</span>
          </NavLink>

          <NavLink 
            to="/coach" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">🧠</span>
            <span>AI Coach</span>
          </NavLink>

          <NavLink 
            to="/profile" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">👤</span>
            <span>Profile</span>
          </NavLink>
        </div>
      </div>

      <div className="user-profile-badge">
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Profile" 
            className="user-avatar" 
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div className="user-avatar" style={{ display: user?.photoURL ? "none" : "flex" }}>
          {getInitials()}
        </div>
        <div className="user-info">
          <span className="user-name">{user?.displayName || "Builder"}</span>
          <span className="user-status">
            {user?.uid === "guest" ? "Guest Mode" : "Synced Auth"}
          </span>
          <button 
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-dark)",
              fontSize: "0.75rem",
              textAlign: "left",
              padding: "2px 0 0 0",
              cursor: "pointer",
              textDecoration: "underline"
            }}
            onMouseOver={(e) => e.target.style.color = "var(--danger)"}
            onMouseOut={(e) => e.target.style.color = "var(--text-dark)"}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;