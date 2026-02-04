import React, { useEffect, useMemo, useState } from "react";
import { X, CreditCard, Landmark, Euro, BadgeDollarSign } from "lucide-react";
import Button from "./Button";

const PRESETS = [20, 50, 100, 200];

// pozwalamy pisać: "12", "12,", "12,3", "12,34", "12.34"
function sanitizeAmountInput(raw, maxLen = 10) {
  if (raw === "") return "";

  let v = String(raw).replace(/[^\d,.\s]/g, "");
  v = v.replace(/\s+/g, "");

  const firstSepIndex = v.search(/[,.]/);
  if (firstSepIndex !== -1) {
    const before = v.slice(0, firstSepIndex);
    const after = v.slice(firstSepIndex + 1).replace(/[,.]/g, "");
    const sep = v[firstSepIndex];
    v = `${before}${sep}${after}`;
  }

  const m = v.match(/^(\d+)([,.](\d{0,2})?)?$/);
  if (!m) {
    const digits = v.replace(/[^\d]/g, "");
    v = digits === "" ? "" : digits;
  } else {
    const intPart = m[1] || "";
    const sep = m[2] ? (m[2].includes(",") ? "," : ".") : "";
    const decPart = m[3] ?? "";
    v = sep ? `${intPart}${sep}${decPart}` : intPart;
  }

  // 🔒 limit długości (po całym formatowaniu)
  return v.slice(0, maxLen);
}

function parseAmountToNumber(amountStr) {
  if (!amountStr) return 0;
  const normalized = amountStr.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(amount, currency) {
  if (amount === null || amount === undefined) return "";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function DonateModal({
  open,
  onClose,
  projectTitle,
  defaultCurrency = "PLN",
  bankAccounts,
}) {
  const [currency, setCurrency] = useState(defaultCurrency);
  const [method, setMethod] = useState("transfer"); // transfer | stripe
  const [amountStr, setAmountStr] = useState("50");

  useEffect(() => {
    if (!open) return;
    setCurrency(defaultCurrency);
    setMethod("transfer");
    setAmountStr("50");
  }, [open, defaultCurrency]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const account = useMemo(() => {
    return bankAccounts?.[currency] || null;
  }, [bankAccounts, currency]);

  const amountNumber = useMemo(
    () => parseAmountToNumber(amountStr),
    [amountStr],
  );

  const handlePreset = (v) => {
    setAmountStr(String(v)); // preset daje czystą liczbę
  };

  const handleAmountChange = (e) => {
    const next = sanitizeAmountInput(e.target.value, 10);
    setAmountStr(next);
  };

  const handleAmountBlur = () => {
    // na blur możesz "uporządkować" (opcjonalnie)
    if (amountStr === "") return;

    // jeśli ktoś zostawi "12," -> traktuj jako 12
    const n = parseAmountToNumber(amountStr);
    if (!n) {
      setAmountStr("");
      return;
    }

    // zostaw max 2 miejsca
    const fixed = n
      .toFixed(2)
      .replace(/\.00$/, "")
      .replace(/(\.\d)0$/, "$1");
    // wróć do przecinka jeśli ktoś używa przecinka:
    const wantsComma = amountStr.includes(",");
    setAmountStr(wantsComma ? fixed.replace(".", ",") : fixed);
  };

  const handleContinue = () => {
    // tu kiedyś będzie stripe / itd.
    // na razie walidacja tylko UX:
    const n = parseAmountToNumber(amountStr);

    if (!n || n <= 0) {
      alert("Podaj poprawną kwotę 🙂");
      return;
    }

    alert("UI only 🙂");
  };

  if (!open) return null;

  return (
    <div className="donate-modal" role="dialog" aria-modal="true">
      <button
        className="donate-modal__backdrop"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="donate-modal__panel">
        <div className="donate-modal__header">
          <div className="donate-modal__title-wrap">
            <div className="donate-modal__kicker">Wsparcie zbiórki</div>
            <h3 className="donate-modal__title">
              {projectTitle || "Wybierz sposób wsparcia"}
            </h3>
          </div>

          <button className="donate-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="donate-modal__body">
          {/* WALUTA */}
          <div className="donate-modal__section">
            <div className="donate-modal__label">Waluta</div>

            <div className="donate-modal__segmented" role="tablist">
              <button
                type="button"
                className={`donate-modal__seg ${
                  currency === "PLN" ? "is-active" : ""
                }`}
                onClick={() => setCurrency("PLN")}
              >
                <BadgeDollarSign size={16} />
                PLN
              </button>

              <button
                type="button"
                className={`donate-modal__seg ${
                  currency === "EUR" ? "is-active" : ""
                }`}
                onClick={() => setCurrency("EUR")}
              >
                <Euro size={16} />
                EUR
              </button>
            </div>
          </div>

          {/* KWOTA */}
          <div className="donate-modal__section">
            <div className="donate-modal__label">Kwota</div>

            <div className="donate-modal__presets">
              {PRESETS.map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`donate-modal__preset ${
                    Number(amountNumber) === v ? "is-active" : ""
                  }`}
                  onClick={() => handlePreset(v)}
                >
                  {formatMoney(v, currency)}
                </button>
              ))}
            </div>

            <div className="donate-modal__amount-row">
              <label className="donate-modal__amount-input">
                <span>Inna kwota</span>
                <input
                  inputMode="decimal"
                  value={amountStr}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  placeholder="np. 25,50"
                  maxLength={10}
                />
              </label>

              <div className="donate-modal__amount-preview">
                {amountStr === ""
                  ? "—"
                  : formatMoney(Number(amountNumber || 0), currency)}
              </div>
            </div>
          </div>

          {/* METODA */}
          <div className="donate-modal__section">
            <div className="donate-modal__label">Metoda płatności</div>

            <div className="donate-modal__methods">
              <button
                type="button"
                className={`donate-modal__method ${
                  method === "transfer" ? "is-active" : ""
                }`}
                onClick={() => setMethod("transfer")}
              >
                <Landmark size={18} />
                <div>
                  <div className="donate-modal__method-title">
                    Przelew tradycyjny
                  </div>
                  <div className="donate-modal__method-desc">
                    Dane do przelewu wyświetlą się poniżej
                  </div>
                </div>
              </button>

              <button
                type="button"
                className={`donate-modal__method ${
                  method === "stripe" ? "is-active" : ""
                }`}
                onClick={() => setMethod("stripe")}
              >
                <CreditCard size={18} />
                <div>
                  <div className="donate-modal__method-title">Stripe</div>
                  <div className="donate-modal__method-desc">
                    (na razie tylko UI)
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* TREŚĆ ZALEŻNA OD METODY */}
          {method === "transfer" ? (
            <div className="donate-modal__section donate-modal__details">
              <div className="donate-modal__label">Dane do przelewu</div>

              {!account ? (
                <div className="donate-modal__note">
                  Brak danych do przelewu dla waluty <strong>{currency}</strong>
                  .
                </div>
              ) : (
                <div className="donate-modal__bank">
                  <div className="donate-modal__bank-row">
                    <span>Odbiorca</span>
                    <strong>{account.recipient}</strong>
                  </div>
                  <div className="donate-modal__bank-row">
                    <span>Tytuł</span>
                    <strong>{account.title || "Darowizna"}</strong>
                  </div>
                  <div className="donate-modal__bank-row">
                    <span>Konto</span>
                    <strong>{account.iban}</strong>
                  </div>
                  {account.swift && (
                    <div className="donate-modal__bank-row">
                      <span>SWIFT/BIC</span>
                      <strong>{account.swift}</strong>
                    </div>
                  )}
                  {account.bankName && (
                    <div className="donate-modal__bank-row">
                      <span>Bank</span>
                      <strong>{account.bankName}</strong>
                    </div>
                  )}

                  <div className="donate-modal__hint">
                    Kwota do przelania:{" "}
                    <strong>
                      {amountStr === ""
                        ? "—"
                        : formatMoney(Number(amountNumber || 0), currency)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="donate-modal__section donate-modal__details">
              <div className="donate-modal__label">Stripe</div>
              <div className="donate-modal__note">
                Tutaj później podepniesz tworzenie sesji Stripe / checkout.
                <br />
                Wybrano:{" "}
                <strong>
                  {amountStr === ""
                    ? "—"
                    : formatMoney(Number(amountNumber || 0), currency)}
                </strong>
              </div>
            </div>
          )}
        </div>

        <div className="donate-modal__footer">
          <Button variant="secondary" size="md" onClick={onClose}>
            Zamknij
          </Button>

          <Button variant="primary" size="md" onClick={handleContinue}>
            Kontynuuj
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DonateModal;
