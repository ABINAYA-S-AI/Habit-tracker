import { useEffect, useState, useRef } from "react";
import "../App.css";
import { fetchHabitsData } from "../utils/storage";

function Coach({ user }) {
  const [habits, setHabits] = useState([]);
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

  // Coach logic: Generates smart, personalized answers
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

  const handleSendMessage = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const newUserMsg = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const coachText = generateResponse(textToSend);
      setMessages(prev => [...prev, { sender: "coach", text: coachText }]);
      setIsTyping(false);
    }, 1000);
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
      <div className="coach-header-card glass-panel">
        <div className="coach-avatar-large">🧠</div>
        <div className="coach-header-info">
          <h2>Habit AI Coach</h2>
          <p>Personal Coach for consistency. Ask anything in English or Tanglish!</p>
        </div>
      </div>

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
              onClick={() => handleSendMessage(opt.substring(2))} // Remove emoji
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
            placeholder="Type your question (e.g. 'lazy status', 'streaks', 'stats')..."
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
