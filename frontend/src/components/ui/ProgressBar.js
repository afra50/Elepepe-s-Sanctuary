import React from "react";

const ProgressBar = ({ current, goal }) => {
  // Obliczamy procent, max 100%
  const percentage = Math.min((current / goal) * 100, 100);

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
    </div>
  );
};

export default ProgressBar;
