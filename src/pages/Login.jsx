import "../App.css";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { mergeGuestDataToFirestore } from "../utils/storage";

function Login({ setUser }) {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      // Merge guest logs if any
      await mergeGuestDataToFirestore(result.user);
      setUser(result.user);
    } catch (error) {
      console.error(error);
      alert("Google Login failed. Please check connection or try Guest Mode.");
    }
  };

  const handleGuestLogin = () => {
    localStorage.setItem("habit_ai_guest", "true");
    setUser({ uid: "guest", displayName: "Guest Builder" });
  };

  return (
    <div className="login-page">
      <div className="login-card glass-panel">
        <span className="login-logo">🔥</span>
        <h1>Habit AI</h1>
        <p>
          Build Better Habits Everyday.<br />
          Track streaks, get personalized AI coaching, and monitor your daily progress.
        </p>

        <div className="login-buttons-stack">
          <button className="google-login-btn" onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: "4px" }}>
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.77-2.34 3.57l3.29 2.55c1.92-1.77 3.03-4.38 3.03-7.24z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.29-2.55c-.9.6-2.07.96-3.32.96-2.55 0-4.72-1.73-5.5-4.06L1.1 18.06C2.75 21.6 6.35 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M6.5 15.44a7.2 7.2 0 0 1 0-4.88l-3.75-2.9C1.8 10.3 0 12.06 0 14s.9 3.7 2.75 6.34l3.75-2.9z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l2.9-2.9C17.96 1.19 15.24 0 12 0 6.35 0 2.75 2.4 1.1 5.94l3.75 2.9c.78-2.33 2.95-4.09 5.5-4.09z"
              />
            </svg>
            Continue with Google
          </button>

          <button className="guest-login-btn" onClick={handleGuestLogin}>
            ⚡ Continue as Guest (Local)
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;