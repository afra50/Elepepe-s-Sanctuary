import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import ProgressBar from "./ui/ProgressBar";
import DonateModal from "./ui/DonateModal";
import { Calendar } from "lucide-react";

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

function FundraiserCard({ project, onCardClick }) {
  const [donateOpen, setDonateOpen] = useState(false);

  const isCompleted = project.isCompleted;
  const { t } = useTranslation("common");
  const { id, title, image, current, goal, endDate } = project;

  const daysLeft = getDaysLeft(endDate);

  const handleCardClick = () => {
    onCardClick?.(id); // nawigacja po Twojej stronie (navigate(`/projects/${slug}`))
  };

  const handleDonateClick = (e) => {
    e.stopPropagation(); // żeby nie odpaliło kliknięcia karty
    setDonateOpen(true);
  };

  return (
    <>
      <div className="fundraiser-card" onClick={handleCardClick}>
        <div className="fundraiser-card__img-wrapper">
          <div
            className="fundraiser-card__image"
            style={{ backgroundImage: `url(${image})` }}
          />
        </div>

        <div className="fundraiser-card__content">
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

            <ProgressBar current={current} goal={goal} />
          </div>

          {isCompleted ? (
            <Button
              variant="outline"
              className="full-width"
              onClick={(e) => {
                e.stopPropagation();
                onCardClick?.(id);
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

      <DonateModal
        open={donateOpen}
        onClose={() => setDonateOpen(false)}
        projectTitle={title}
        defaultCurrency="PLN"
        bankAccounts={{
          PLN: {
            recipient: "Elepepe’s Sanctuary",
            iban: "12 3456 7890 1234 5678 9012 3456",
            swift: "BPKOPLPW", // przykładowy BIC — wstaw swój prawdziwy
            bankName: "Bank w PL",
            title: `Darowizna – ${title}`,
          },
          EUR: {
            recipient: "Elepepe’s Sanctuary",
            iban: "DE12 3456 7890 1234 5678 90",
            swift: "DEUTDEFF",
            bankName: "Bank in EU",
            title: `Donation – ${title}`,
          },
        }}
      />
    </>
  );
}

export default FundraiserCard;
