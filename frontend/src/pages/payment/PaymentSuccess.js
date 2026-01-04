import React from "react";
import { useTranslation } from "react-i18next";
import { CircleCheckBig } from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../../components/ui/Button";

function PaymentSuccess() {
  const { t } = useTranslation("payment");

  return (
    <div className="last-payment-page success">
      <div className="payment-container">
        <CircleCheckBig className="success-icon" />

        <h1 className="last-payment-title">{t("success.title")}</h1>

        <p className="last-payment-text">{t("success.description")}</p>

        <div className="buttons-container">
          <NavLink to="/">
            <Button variant="primary" size="lg">
              {t("success.primary")}
            </Button>
          </NavLink>

          <NavLink to="/">
            <Button variant="secondary" size="lg">
              {t("success.secondary")}
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
