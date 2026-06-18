// storage.js - Local & Firebase Storage Coordinator
import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  writeBatch
} from "firebase/firestore";

// Helper to get local date strings
export const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getYesterdayString = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Check if a habit's streak is broken and auto-reset it
export const calculateStreak = (habit) => {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const lastDone = habit.lastDoneDate;

  if (!lastDone) {
    return { ...habit, Streak: 0, done: false };
  }

  // If already done today
  if (lastDone === today) {
    return { ...habit, done: true };
  }

  // If last done yesterday, streak is maintained but done status resets to false for the new day
  if (lastDone === yesterday) {
    return { ...habit, done: false };
  }

  // If last done was before yesterday, streak is broken!
  return { ...habit, Streak: 0, done: false };
};

// Local storage fallback handlers
const getLocalHabits = () => {
  const data = localStorage.getItem("habit_ai_habits");
  if (!data) return [];
  try {
    const parsed = JSON.parse(data);
    return parsed.map(calculateStreak);
  } catch (e) {
    return [];
  }
};

const saveLocalHabits = (habits) => {
  localStorage.setItem("habit_ai_habits", JSON.stringify(habits));
};

// API Functions
export const fetchHabitsData = async (user) => {
  if (!user) {
    // Guest mode
    return getLocalHabits();
  }

  try {
    const q = query(collection(db, "habits"), where("userId", "==", user.uid));
    const snapshot = await getDocs(q);
    const list = [];
    
    snapshot.forEach((docSnapshot) => {
      list.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      });
    });

    // Run streak calculations and sync any auto-resets back to Firestore asynchronously
    const calculatedList = list.map(calculateStreak);
    
    calculatedList.forEach(async (updatedHabit, index) => {
      const original = list[index];
      if (updatedHabit.Streak !== original.Streak || updatedHabit.done !== original.done) {
        // Update in background
        const habitRef = doc(db, "habits", updatedHabit.id);
        await updateDoc(habitRef, {
          Streak: updatedHabit.Streak,
          done: updatedHabit.done
        });
      }
    });

    return calculatedList;
  } catch (error) {
    console.error("Firestore read error, falling back to local storage:", error);
    return getLocalHabits();
  }
};

export const addHabitData = async (user, habitInput) => {
  const newHabit = {
    name: habitInput.name,
    time: habitInput.time || "08:00",
    category: habitInput.category || "health",
    color: habitInput.color || "violet",
    Streak: 0,
    longestStreak: 0,
    done: false,
    lastDoneDate: "",
    history: [],
    userId: user ? user.uid : "guest",
    createdAt: new Date().toISOString()
  };

  if (!user) {
    const habits = getLocalHabits();
    const localId = "local_" + Date.now();
    const habitWithId = { ...newHabit, id: localId };
    habits.push(habitWithId);
    saveLocalHabits(habits);
    return habitWithId;
  }

  try {
    const docRef = await addDoc(collection(db, "habits"), newHabit);
    return { ...newHabit, id: docRef.id };
  } catch (error) {
    console.error("Error writing habit, using local storage:", error);
    const habits = getLocalHabits();
    const localId = "local_" + Date.now();
    const habitWithId = { ...newHabit, id: localId };
    habits.push(habitWithId);
    saveLocalHabits(habits);
    return habitWithId;
  }
};

export const markHabitDoneData = async (user, habit) => {
  const today = getTodayString();
  let updated;

  if (habit.done) {
    // Undo today's completion
    const newHistory = (habit.history || []).filter(date => date !== today);
    // Find the previous streak or reduce by 1
    const newStreak = Math.max(habit.Streak - 1, 0);
    
    // Determine the previous last done date
    let prevLastDone = "";
    if (newHistory.length > 0) {
      prevLastDone = newHistory[newHistory.length - 1];
    }

    updated = {
      ...habit,
      done: false,
      Streak: newStreak,
      lastDoneDate: prevLastDone,
      history: newHistory
    };
  } else {
    // Mark as done today
    const newHistory = [...(habit.history || [])];
    if (!newHistory.includes(today)) {
      newHistory.push(today);
    }
    const newStreak = habit.Streak + 1;
    const newLongest = Math.max(newStreak, habit.longestStreak || 0);

    updated = {
      ...habit,
      done: true,
      Streak: newStreak,
      longestStreak: newLongest,
      lastDoneDate: today,
      history: newHistory
    };
  }

  if (!user || habit.id.startsWith("local_")) {
    const habits = getLocalHabits();
    const index = habits.findIndex(h => h.id === habit.id);
    if (index !== -1) {
      habits[index] = updated;
      saveLocalHabits(habits);
    }
    return updated;
  }

  try {
    const habitRef = doc(db, "habits", habit.id);
    await updateDoc(habitRef, {
      done: updated.done,
      Streak: updated.Streak,
      longestStreak: updated.longestStreak,
      lastDoneDate: updated.lastDoneDate,
      history: updated.history
    });
    return updated;
  } catch (error) {
    console.error("Error marking habit done, saving to local storage:", error);
    // fallback
    const habits = getLocalHabits();
    const index = habits.findIndex(h => h.id === habit.id);
    if (index !== -1) {
      habits[index] = updated;
      saveLocalHabits(habits);
    }
    return updated;
  }
};

export const deleteHabitData = async (user, habitId) => {
  if (!user || habitId.startsWith("local_")) {
    const habits = getLocalHabits();
    const filtered = habits.filter(h => h.id !== habitId);
    saveLocalHabits(filtered);
    return true;
  }

  try {
    await deleteDoc(doc(db, "habits", habitId));
    return true;
  } catch (error) {
    console.error("Error deleting habit, removing from local storage copy:", error);
    const habits = getLocalHabits();
    const filtered = habits.filter(h => h.id !== habitId);
    saveLocalHabits(filtered);
    return true;
  }
};

// Merge guest data into Firestore when logging in
export const mergeGuestDataToFirestore = async (firebaseUser) => {
  const localHabits = getLocalHabits();
  if (localHabits.length === 0) return;

  try {
    const batch = writeBatch(db);
    
    for (const habit of localHabits) {
      const habitRef = doc(collection(db, "habits"));
      const syncedHabit = {
        name: habit.name,
        time: habit.time,
        category: habit.category,
        color: habit.color,
        Streak: habit.Streak,
        longestStreak: habit.longestStreak,
        done: habit.done,
        lastDoneDate: habit.lastDoneDate,
        history: habit.history || [],
        userId: firebaseUser.uid,
        createdAt: habit.createdAt || new Date().toISOString()
      };
      batch.set(habitRef, syncedHabit);
    }

    await batch.commit();
    localStorage.removeItem("habit_ai_habits");
  } catch (error) {
    console.error("Failed to sync guest habits to Firestore:", error);
  }
};

export const updateHabitFieldData = async (user, habitId, fields) => {
  if (!user || habitId.startsWith("local_")) {
    const data = localStorage.getItem("habit_ai_habits");
    if (!data) return null;
    try {
      const habits = JSON.parse(data);
      const index = habits.findIndex(h => h.id === habitId);
      if (index !== -1) {
        habits[index] = { ...habits[index], ...fields };
        localStorage.setItem("habit_ai_habits", JSON.stringify(habits));
        return habits[index];
      }
    } catch (e) {
      return null;
    }
  }

  try {
    const habitRef = doc(db, "habits", habitId);
    await updateDoc(habitRef, fields);
    return true;
  } catch (error) {
    console.error("Error updating habit field:", error);
    return null;
  }
};
