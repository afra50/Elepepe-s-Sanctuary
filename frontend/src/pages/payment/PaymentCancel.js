import React from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert } from "lucide-react";
import { NavLink } from "react-router-dom";
import Button from "../../components/ui/Button";

function PaymentCancel() {
  const { t } = useTranslation("payment");

  return (
    <div className="last-payment-page cancel">
      <div className="payment-container">
        <CircleAlert className="cancel-icon" />

        <h1 className="last-payment-title">{t("cancel.title")}</h1>

        <p className="last-payment-text">{t("cancel.description")}</p>

        <div className="buttons-container">
          <NavLink to="/contact">
            <Button variant="primary" size="lg">
              {t("cancel.primary")}
            </Button>
          </NavLink>

          <NavLink to="/">
            <Button variant="secondary" size="lg">
              {t("cancel.secondary")}
            </Button>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default PaymentCancel;
