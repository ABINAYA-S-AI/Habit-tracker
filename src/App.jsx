import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reminder from "./pages/Reminder";
import Profile from "./pages/Profile";
import Coach from "./pages/Coach";
import Navbar from "./components/Navbar";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is an active Firebase Auth session
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.removeItem("habit_ai_guest"); // Clear guest flag if logged in
      } else {
        // Check if user has selected Guest Mode
        const isGuest = localStorage.getItem("habit_ai_guest") === "true";
        if (isGuest) {
          setUser({ uid: "guest", displayName: "Guest Builder" });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("habit_ai_guest");
    await auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        background: "#0b0f19",
        color: "#f8fafc",
        fontFamily: "'Outfit', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ marginBottom: "15px", letterSpacing: "1px" }}>LOADING HABIT AI...</h2>
          <div style={{ 
            width: "50px", 
            height: "50px", 
            border: "3px solid rgba(139, 92, 246, 0.2)",
            borderTopColor: "#8b5cf6",
            borderRadius: "50%",
            margin: "0 auto",
            animation: "pulseGlow 1.5s infinite linear"
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login setUser={setUser} />} 
        />

        {/* Protected Routes Wrapper */}
        <Route
          path="/*"
          element={
            user ? (
              <div className="app-container">
                <Navbar user={user} handleLogout={handleLogout} />
                <main className="main-content">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard user={user} />} />
                    <Route path="/reminder" element={<Reminder user={user} />} />
                    <Route path="/coach" element={<Coach user={user} />} />
                    <Route path="/profile" element={<Profile user={user} />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </main>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;