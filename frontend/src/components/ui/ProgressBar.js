import React from "react";

const ProgressBar = ({ current, goal }) => {
  const rawPercentage = goal > 0 ? (current / goal) * 100 : 0;

  const remainder = rawPercentage % 100;
  const hasOverflow = rawPercentage > 100;

  const mainBar = Math.min(rawPercentage, 100);
  const overflowBar = hasOverflow ? remainder : 0;

  const roundedLabel = Math.round(rawPercentage);

  // 🔥 label idzie z końcem AKTUALNEGO obiegu
  const labelPosition = hasOverflow
    ? Math.min(Math.max(overflowBar, 5), 95)
    : Math.min(Math.max(mainBar, 5), 95);

  return (
    <div className="progress">
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${mainBar}%` }} />

        {hasOverflow && (
          <div
            className="progress__overflow"
            style={{ width: `${overflowBar}%` }}
          />
        )}
      </div>

      <div
        className="progress__label"
        data-over={hasOverflow}
        style={{ left: `${labelPosition}%` }}
      >
        {roundedLabel}%
      </div>
    </div>
  );
};

export default ProgressBar;
