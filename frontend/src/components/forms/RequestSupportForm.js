import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

const initialForm = {
  // Dane zgłaszającego
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",

  // Zwierzak
  species: "",
  animalName: "",
  age: "",
  sex: "",
  animalsCount: "",

  // Opis i sytuacja
  description: "",
  amount: "",
  currency: "EUR",
  amountType: "estimated", // "exact" | "estimated"
  deadline: "",
  treatmentOngoing: false,
  needsInstallments: false,
  otherFundraiserLink: "",
  otherHelp: "",

  // Dane do wypłaty
  payoutName: "",
  payoutIban: "",
  payoutBankName: "",
  payoutBankCountry: "",

  // Zgody
  consentDataProcessing: false,
  consentTruth: false,
  consentPublicStory: false,
};

function RequestSupportForm({ onShowAlert }) {
  const { t } = useTranslation("request");
  const [form, setForm] = useState(initialForm);
  const [files, setFiles] = useState({
    petPhotos: [],
    documents: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: fileList } = e.target;

    setFiles((prev) => ({
      ...prev,
      [name]: Array.from(fileList),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // TODO: tu później dodamy walidację jak przy ContactForm

    // Na razie tylko logujemy dane
    console.log("Request support form:", { form, files });

    onShowAlert?.({
      variant: "success",
      message: t("form.alerts.success"),
    });

    // ewentualny reset po wysłaniu
    // setForm(initialForm);
    // setFiles({ petPhotos: [], documents: [] });
  };

  return (
    <form className="request-form" onSubmit={handleSubmit} noValidate>
      {/* === 1. Dane zgłaszającego === */}
      <section className="request-section request-section--applicant">
        <h3>{t("form.sections.applicant")}</h3>

        <div className="form-field">
          <label htmlFor="fullName">{t("form.fields.fullName.label")}</label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={form.fullName}
            onChange={handleChange}
            placeholder={t("form.fields.fullName.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="email">{t("form.fields.email.label")}</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder={t("form.fields.email.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="phone">{t("form.fields.phone.label")}</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder={t("form.fields.phone.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="country">{t("form.fields.country.label")}</label>
          <input
            id="country"
            name="country"
            type="text"
            value={form.country}
            onChange={handleChange}
            placeholder={t("form.fields.country.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="city">
            {t("form.fields.city.label")}
            <span className="field-hint"> ({t("form.fields.optional")})</span>
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={form.city}
            onChange={handleChange}
            placeholder={t("form.fields.city.placeholder")}
          />
        </div>
      </section>

      {/* === 2. Dane zwierzaka === */}
      <section className="request-section request-section--animal">
        <h3>{t("form.sections.animal")}</h3>

        <div className="form-field">
          <label htmlFor="species">{t("form.fields.species.label")}</label>
          <select
            id="species"
            name="species"
            value={form.species}
            onChange={handleChange}
            required
          >
            <option value="">{t("form.fields.species.placeholder")}</option>
            <option value="rat">{t("form.fields.species.options.rat")}</option>
            <option value="guineaPig">
              {t("form.fields.species.options.guineaPig")}
            </option>
            <option value="other">
              {t("form.fields.species.options.other")}
            </option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="animalName">
            {t("form.fields.animalName.label")}
          </label>
          <input
            id="animalName"
            name="animalName"
            type="text"
            value={form.animalName}
            onChange={handleChange}
            placeholder={t("form.fields.animalName.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="animalsCount">
            {t("form.fields.animalsCount.label")}
          </label>
          <input
            id="animalsCount"
            name="animalsCount"
            type="number"
            min="1"
            value={form.animalsCount}
            onChange={handleChange}
            placeholder={t("form.fields.animalsCount.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="age">
            {t("form.fields.age.label")}{" "}
            <span className="field-hint">({t("form.fields.optional")})</span>
          </label>
          <input
            id="age"
            name="age"
            type="text"
            value={form.age}
            onChange={handleChange}
            placeholder={t("form.fields.age.placeholder")}
          />
        </div>

        <div className="form-field">
          <label htmlFor="sex">
            {t("form.fields.sex.label")}{" "}
            <span className="field-hint">({t("form.fields.optional")})</span>
          </label>
          <select id="sex" name="sex" value={form.sex} onChange={handleChange}>
            <option value="">{t("form.fields.sex.placeholder")}</option>
            <option value="female">
              {t("form.fields.sex.options.female")}
            </option>
            <option value="male">{t("form.fields.sex.options.male")}</option>
            <option value="unknown">
              {t("form.fields.sex.options.unknown")}
            </option>
          </select>
        </div>
      </section>

      {/* === 3. Opis sytuacji i potrzeby === */}
      <section className="request-section request-section--case">
        <h3>{t("form.sections.case")}</h3>

        <div className="form-field">
          <label htmlFor="description">
            {t("form.fields.description.label")}
          </label>
          <textarea
            id="description"
            name="description"
            rows="6"
            value={form.description}
            onChange={handleChange}
            placeholder={t("form.fields.description.placeholder")}
            required
          />
        </div>

        <div className="request-row request-row--amount">
          <div className="form-field">
            <label htmlFor="amount">{t("form.fields.amount.label")}</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder={t("form.fields.amount.placeholder")}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="currency">{t("form.fields.currency.label")}</label>
            <select
              id="currency"
              name="currency"
              value={form.currency}
              onChange={handleChange}
              required
            >
              <option value="EUR">EUR</option>
              <option value="PLN">PLN</option>
            </select>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="amountType">
            {t("form.fields.amountType.label")}
          </label>
          <select
            id="amountType"
            name="amountType"
            value={form.amountType}
            onChange={handleChange}
          >
            <option value="estimated">
              {t("form.fields.amountType.options.estimated")}
            </option>
            <option value="exact">
              {t("form.fields.amountType.options.exact")}
            </option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="deadline">{t("form.fields.deadline.label")}</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={form.deadline}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="treatmentOngoing"
              checked={form.treatmentOngoing}
              onChange={handleChange}
            />
            {t("form.fields.treatmentOngoing.label")}
          </label>
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="needsInstallments"
              checked={form.needsInstallments}
              onChange={handleChange}
            />
            {t("form.fields.needsInstallments.label")}
          </label>
        </div>

        <div className="form-field">
          <label htmlFor="otherFundraiserLink">
            {t("form.fields.otherFundraiserLink.label")}
          </label>
          <input
            id="otherFundraiserLink"
            name="otherFundraiserLink"
            type="url"
            value={form.otherFundraiserLink}
            onChange={handleChange}
            placeholder={t("form.fields.otherFundraiserLink.placeholder")}
          />
        </div>

        <div className="form-field">
          <label htmlFor="otherHelp">{t("form.fields.otherHelp.label")}</label>
          <textarea
            id="otherHelp"
            name="otherHelp"
            rows="3"
            value={form.otherHelp}
            onChange={handleChange}
            placeholder={t("form.fields.otherHelp.placeholder")}
          />
        </div>
      </section>

      {/* === 4. Załączniki === */}
      <section className="request-section request-section--attachments">
        <h3>{t("form.sections.attachments")}</h3>

        <div className="form-field">
          <label htmlFor="petPhotos">{t("form.fields.petPhotos.label")}</label>
          <input
            id="petPhotos"
            name="petPhotos"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          <p className="field-hint">{t("form.fields.petPhotos.hint")}</p>
        </div>

        <div className="form-field">
          <label htmlFor="documents">{t("form.fields.documents.label")}</label>
          <input
            id="documents"
            name="documents"
            type="file"
            accept=".pdf,image/*"
            multiple
            onChange={handleFileChange}
          />
          <p className="field-hint">{t("form.fields.documents.hint")}</p>
        </div>
      </section>

      {/* === 5. Dane do wypłaty === */}
      <section className="request-section request-section--payout">
        <h3>{t("form.sections.payout")}</h3>

        <div className="form-field">
          <label htmlFor="payoutName">
            {t("form.fields.payoutName.label")}
          </label>
          <input
            id="payoutName"
            name="payoutName"
            type="text"
            value={form.payoutName}
            onChange={handleChange}
            placeholder={t("form.fields.payoutName.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="payoutIban">
            {t("form.fields.payoutIban.label")}
          </label>
          <input
            id="payoutIban"
            name="payoutIban"
            type="text"
            value={form.payoutIban}
            onChange={handleChange}
            placeholder={t("form.fields.payoutIban.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="payoutBankName">
            {t("form.fields.payoutBankName.label")}
          </label>
          <input
            id="payoutBankName"
            name="payoutBankName"
            type="text"
            value={form.payoutBankName}
            onChange={handleChange}
            placeholder={t("form.fields.payoutBankName.placeholder")}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="payoutBankCountry">
            {t("form.fields.payoutBankCountry.label")}
          </label>
          <input
            id="payoutBankCountry"
            name="payoutBankCountry"
            type="text"
            value={form.payoutBankCountry}
            onChange={handleChange}
            placeholder={t("form.fields.payoutBankCountry.placeholder")}
            required
          />
        </div>
      </section>

      {/* === 6. Zgody === */}
      <section className="request-section request-section--consents">
        <h3>{t("form.sections.consents")}</h3>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="consentDataProcessing"
              checked={form.consentDataProcessing}
              onChange={handleChange}
              required
            />
            {t("form.fields.consentDataProcessing.label")}
          </label>
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="consentTruth"
              checked={form.consentTruth}
              onChange={handleChange}
              required
            />
            {t("form.fields.consentTruth.label")}
          </label>
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="consentPublicStory"
              checked={form.consentPublicStory}
              onChange={handleChange}
            />
            {t("form.fields.consentPublicStory.label")}
          </label>
        </div>
      </section>

      {/* Akcje */}
      <div className="form-actions">
        <Button type="submit" variant="primary" size="md">
          {t("form.submit")}
        </Button>
      </div>
    </form>
  );
}

export default RequestSupportForm;
