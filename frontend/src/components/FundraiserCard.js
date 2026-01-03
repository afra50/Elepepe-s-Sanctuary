import React from "react";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import ProgressBar from "./ui/ProgressBar";

import { Calendar } from "lucide-react";
// albo: import { Clock } from "lucide-react";

function getDaysLeft(endDate) {
  if (!endDate) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays < 0 ? 0 : diffDays;
}

function FundraiserCard({ project, onCardClick, onDonateClick }) {
  const isCompleted = project.isCompleted;
  const { t } = useTranslation("common");
  const { id, title, image, current, goal, endDate } = project;

  const daysLeft = getDaysLeft(endDate);
  const percentage =
    goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

  const handleCardClick = () => {
    if (onCardClick) onCardClick(id);
  };

  const handleDonateClick = (e) => {
    e.stopPropagation();
    if (onDonateClick) onDonateClick(id);
  };

  return (
    <div className="fundraiser-card" onClick={handleCardClick}>
      <div className="fundraiser-card__img-wrapper">
        <div
          className="fundraiser-card__image"
          style={{ backgroundImage: `url(${image})` }}
        />
      </div>

      <div className="fundraiser-card__content">
        {/* Meta / dni do końca */}
        {!isCompleted && typeof daysLeft === "number" && (
          <div className="fundraiser-card__meta">
            <span className="fundraiser-card__days-left">
              <Calendar size={14} strokeWidth={2} />
              {daysLeft > 0
                ? t("fundraiser.daysLeft", { count: daysLeft })
                : t("fundraiser.daysLeftFinished")}
            </span>
          </div>
        )}

        <h3>{title}</h3>

        <div className="fundraiser-card__stats">
          <div className="fundraiser-card__stat-row">
            <span>
              {t("fundraiser.raised")} <strong>{current} PLN</strong>
            </span>
            <span>
              {t("fundraiser.goal")} <strong>{goal} PLN</strong>
            </span>
          </div>

          {/* Pasek postępu z % na końcu */}
          <ProgressBar current={current} goal={goal} />
        </div>

        {isCompleted ? (
          <Button
            variant="outline"
            className="full-width"
            onClick={(e) => {
              e.stopPropagation();
              onCardClick && onCardClick(project.id);
            }}
          >
            {t("fundraiser.seeStory", "Zobacz historię")}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="full-width"
            onClick={handleDonateClick}
          >
            {t("fundraiser.support")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default FundraiserCard;
