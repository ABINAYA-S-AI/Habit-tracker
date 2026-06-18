function ProgressCard({
  completed,
  total,
}) {
  const percent =
    total === 0
      ? 0
      : (completed / total) * 100;

  return (
    <div className="progress-card">
      <h3>
        Progress: {completed}/{total}
      </h3>

      <div className="bar">
        <div
          className="fill"
          style={{
            width: `${percent}%`,
          }}
        ></div>
      </div>
    </div>
  );
}

export default ProgressCard;