import React from "react";
import { useTranslation } from "react-i18next";
import { CircleX } from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../../components/ui/Button";

function PaymentFailure() {
  const { t } = useTranslation("payment");

  return (
    <div className="last-payment-page failure">
      <div className="payment-container">
        <CircleX className="failure-icon" />

        <h1 className="last-payment-title">{t("failure.title")}</h1>

        <p className="last-payment-text">{t("failure.description")}</p>

        <div className="buttons-container">
          <NavLink to="/contact">
            <Button variant="primary" size="lg">
              {t("failure.primary")}
            </Button>
          </NavLink>

          <NavLink to="/">
            <Button variant="secondary" size="lg">
              {t("failure.secondary")}
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default PaymentFailure;
