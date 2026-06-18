import { useEffect, useState, useRef } from "react";
import "../App.css";
import { fetchHabitsData } from "../utils/storage";

function Coach({ user }) {
  const [habits, setHabits] = useState([]);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem("gemini_api_key") || import.meta.env.VITE_GEMINI_API_KEY || ""
  );
  const [tempKey, setTempKey] = useState(apiKey);
  const [showSettings, setShowSettings] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "coach",
      text: `Vanakkam ${user?.displayName || "Builder"}! 👋 I am your Habit AI Coach. Naan unga daily routines, streaks, and progress study panni advice tharuven. Ask me to analyze your stats or write any questions below! 🧠`
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    const loadHabits = async () => {
      const data = await fetchHabitsData(user);
      setHabits(data);
    };
    loadHabits();
  }, [user]);

  // Handle saving API key
  const handleSaveKey = () => {
    const trimmedKey = tempKey.trim();
    localStorage.setItem("gemini_api_key", trimmedKey);
    setApiKey(trimmedKey);
    setShowSettings(false);
    
    setMessages(prev => [
      ...prev,
      {
        sender: "coach",
        text: trimmedKey 
          ? "Awesome! Gemini AI Key linked successfully. I am now fully powered by Gemini AI and ready to answer any of your questions with real-time advice! 🚀"
          : "AI Key removed. Falling back to offline local templates. 🤖"
      }
    ]);
  };

  // Google Gemini API Request
  const askGemini = async (promptText, habitsList, stats) => {
    if (!apiKey) return null;

    const systemInstruction = `You are a helpful, encouraging, and witty Habit AI Coach. The user's name is ${
      user?.displayName || "Builder"
    }. Their current habits list: ${JSON.stringify(
      habitsList
    )}. Today's progress: ${stats.completedToday} out of ${
      stats.totalHabits
    } habits completed. Answer their questions about habits, routines, productivity, lazy feelings, or general queries in a friendly, engaging style, occasionally mixing in common Tamil/Tanglish words (like 'mass', 'buddy', 'super', 'panna mudiyum') to make it fun and relatable. Keep the responses concise (under 4-5 sentences if possible), positive, and action-oriented.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemInstruction}\n\nUser Question: ${promptText}` }]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  };

  // Local rule-based fallback responses
  const generateResponse = (input) => {
    const text = input.toLowerCase();
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.done).length;
    const activeStreaks = habits.map(h => h.Streak || 0);
    const maxStreak = totalHabits > 0 ? Math.max(...activeStreaks) : 0;
    const longestStreakEver = totalHabits > 0 ? Math.max(...habits.map(h => h.longestStreak || 0)) : 0;

    // 1. Progress analysis request
    if (text.includes("analyze") || text.includes("progress") || text.includes("report") || text.includes("stats")) {
      if (totalHabits === 0) {
        return `Unga tracker-la inum habits ethuvum create pannala, buddy! Dashboard-la poi habits add panna thaan ennala statistics analyze panna mudiyum. Let's add a few! 🚀`;
      }
      
      const completionRate = Math.round((completedToday / totalHabits) * 100);
      let review = "";
      if (completionRate === 100) {
        review = "Absolutely flawless! Iniku 100% complete pannitinga, real mass performance! 🔥";
      } else if (completionRate >= 50) {
        review = "Good going! Half-way mark reach pannitinga. Remaining habits-um iniku mudika paarunga! 👍";
      } else {
        review = "Methane power-up panna vendiyathu iruku. Take small steps, oru single habit done panni thuvangunga! ⚡";
      }

      return `Naan unga logs study panniten! 📊 Here is your AI Coach Report:
- Total Habits Active: ${totalHabits}
- Completed Today: ${completedToday} of ${totalHabits} (${completionRate}%)
- Current Top Streak: ${maxStreak} days (Longest: ${longestStreakEver} days)

Analysis: ${review}
Advice: Unga habits time-a alarm mathiri strict-a follow pannunga. Next streak level-up aaga support panren! 💪`;
    }

    // 2. Maintaining streaks
    if (text.includes("streak") || text.includes("maintain") || text.includes("increase")) {
      return `Streaks maintain panna top secret: 'Habit Stacking' 💡
Oru routine chain create pannunga:
1. 'Brush teeth' mudichadhum -> 'Drink Water'
2. 'Work' mudichadhum -> 'Read book 10 mins'
Epdi chain-up panna streak breakdown aagathu. Daily streak level indicators ungaluku badge unlocked panna help pannum! Stay consistent! 🔥`;
    }

    // 3. Lazy / Low motivation
    if (text.includes("lazy") || text.includes("tired") || text.includes("motivation") || text.includes("feel low")) {
      return `I completely understand. Ella naalum high motivation irukathu, and adhunaala thaan discipline mukkiyam! 🧠
Follow the '2-Minute Rule':
Unga habit-a just 2 minutes mattum seiyunga. Gym pogala-naalum pushups seiyunga, long study mudiyala-naalum 1 page mathiyum vaasinga. Starting resistance break panna automatic-a momentum vandhudum. 
Get up, buddy! You got this! ⚡`;
    }

    // 4. Tamil / Tanglish greetings
    if (text.includes("hello") || text.includes("hi") || text.includes("vanakkam") || text.includes("bro") || text.includes("bruh")) {
      return `Hello hello! Habit building journey epdi pogudhu? Streak-a maintain panna help venuma, illa progress report analyze panna solringala? Choose or type a question below! 🚀`;
    }

    // Default response
    return `Interesting question! Routine consistency builds character. Keep tracking everyday, and let the daily streaks level-up. 
Tip: Daily reminders active-a vachukonga so notifications click panni complete panna easy-a irukum! 🏆`;
  };

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newUserMsg = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const habitsList = habits.map(h => ({
        name: h.name,
        category: h.category,
        done: h.done || false,
        streak: h.Streak || 0
      }));
      const completedToday = habits.filter(h => h.done).length;
      const stats = { completedToday, totalHabits: habits.length };

      let coachText = "";
      if (apiKey) {
        coachText = await askGemini(textToSend, habitsList, stats);
      }
      
      // Fallback if no API key or askGemini fails to produce text
      if (!coachText) {
        coachText = generateResponse(textToSend);
      }

      setMessages(prev => [...prev, { sender: "coach", text: coachText }]);
    } catch (error) {
      console.error("Error generating response:", error);
      const fallbackText = generateResponse(textToSend);
      setMessages(prev => [
        ...prev,
        { 
          sender: "coach", 
          text: `⚠️ (AI Error: ${error.message || "Failed to contact Gemini"}). Here is my offline recommendation:\n\n${fallbackText}` 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const options = [
    "📊 Analyze my progress report",
    "🔥 How to maintain my streak?",
    "😔 I feel lazy today. Help!",
    "💡 Give me a habit stack tip"
  ];

  return (
    <div className="coach-container">
      {/* Header */}
      <div className="coach-header-card glass-panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div className="coach-avatar-large">🧠</div>
          <div className="coach-header-info">
            <h2>Habit AI Coach</h2>
            <p>Personal Coach for consistency. Ask anything in English or Tanglish!</p>
          </div>
        </div>
        
        {/* Settings button */}
        <button 
          className="glow-btn"
          style={{ 
            background: apiKey ? "rgba(16, 185, 129, 0.15)" : "rgba(139, 92, 246, 0.15)",
            border: apiKey ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(139, 92, 246, 0.4)",
            color: apiKey ? "#10b981" : "#a78bfa",
            padding: "8px 12px", 
            borderRadius: "8px", 
            fontSize: "0.85rem",
            cursor: "pointer",
            fontWeight: "500"
          }}
          onClick={() => setShowSettings(!showSettings)}
        >
          {apiKey ? "⚙️ AI Active" : "🔑 Setup AI"}
        </button>
      </div>

      {/* API Key Panel */}
      {showSettings && (
        <div className="glass-panel" style={{ padding: "15px", marginBottom: "15px", borderRadius: "12px", background: "rgba(15, 23, 42, 0.8)", border: "1px solid var(--border-color)" }}>
          <h3 style={{ color: "#a78bfa", fontSize: "0.95rem", marginBottom: "8px" }}>⚙️ Configure Google Gemini AI</h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "12px", lineHeight: "1.4" }}>
            Get smart, personalized dynamic answers! Get a free key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: "#a78bfa", textDecoration: "underline" }}>Google AI Studio</a> and paste it below.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <input 
              type="password"
              className="input-element"
              style={{ flex: 1, padding: "8px 12px", fontSize: "0.85rem" }}
              placeholder="Paste your Gemini API Key..."
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
            />
            <button className="glow-btn" style={{ padding: "8px 16px", fontSize: "0.85rem" }} onClick={handleSaveKey}>
              Save
            </button>
          </div>
          {apiKey && (
            <button 
              style={{ background: "none", border: "none", color: "#f87171", fontSize: "0.75rem", marginTop: "10px", textDecoration: "underline", cursor: "pointer" }}
              onClick={() => {
                setTempKey("");
                localStorage.removeItem("gemini_api_key");
                setApiKey("");
                setShowSettings(false);
                setMessages(prev => [...prev, { sender: "coach", text: "AI Key removed. Offline mode active. 🤖" }]);
              }}
            >
              Remove Saved Key
            </button>
          )}
        </div>
      )}

      {/* Chat Window */}
      <div className="coach-chat-window glass-panel">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`chat-bubble ${msg.sender}`}>
              <div style={{ whiteSpace: "pre-line" }}>{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-bubble coach" style={{ fontStyle: "italic", color: "var(--text-muted)" }}>
              Coach is analyzing your routines... 🧠✍️
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Tappable Options */}
        <div className="coach-options-row">
          {options.map((opt, i) => (
            <button 
              key={i} 
              className="coach-option-btn"
              onClick={() => handleSendMessage(opt.substring(2))}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Text Area Input */}
        <div className="chat-input-bar">
          <input 
            type="text"
            className="input-element"
            placeholder={apiKey ? "Ask me anything about your habits..." : "Type here (or click Setup AI above to unlock Gemini)..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
          />
          <button className="glow-btn" style={{ padding: "0 25px" }} onClick={() => handleSendMessage(inputValue)}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Coach;
