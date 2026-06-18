function HabitCard({
  habit,
  onDone,
  onDelete,
}) {
  return (
    <div className="habit-card">
      <h2>{habit.name}</h2>

      <p>
        🔥 {habit.Streak} days
      </p>

      <button
        onClick={() => onDone(habit)}
      >
        {habit.done
          ? "Done Today ✅"
          : "Mark Done"}
      </button>

      <button
        onClick={() =>
          onDelete(habit.id)
        }
      >
        Delete
      </button>
    </div>
  );
}

export default HabitCard;