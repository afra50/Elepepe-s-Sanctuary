import React from "react";

const ProgressBar = ({ current, goal }) => {
  const rawPercentage = goal > 0 ? (current / goal) * 100 : 0;
  const percentage = Math.min(rawPercentage, 100);
  const rounded = Math.round(percentage);

  // pozycja labelki, żeby nie wychodziła poza krawędzie
  const labelPosition = Math.min(Math.max(percentage, 5), 95);

  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${percentage}%` }} />
      </div>

      <div className="progress__label" style={{ left: `${labelPosition}%` }}>
        {rounded}%
      </div>
    </div>
  );
};

export default ProgressBar;
