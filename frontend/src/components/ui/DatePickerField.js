// ui/DatePickerField.jsx
import React, { forwardRef } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";

// locale z date-fns
import pl from "date-fns/locale/pl";
import enGB from "date-fns/locale/en-GB";
import es from "date-fns/locale/es";

// rejestracja locale dla react-datepicker
registerLocale("pl", pl);
registerLocale("en", enGB);
registerLocale("es", es);

const DateInput = forwardRef(
  ({ value, onClick, placeholder, id, name }, ref) => {
    return (
      <input
        id={id}
        name={name}
        type="text"
        readOnly
        className="date-input__control"
        onClick={onClick}
        ref={ref}
        value={value || ""}
        placeholder={placeholder}
      />
    );
  }
);

function DatePickerField({ id, name, value, onChange, placeholder }) {
  const { i18n } = useTranslation();

  const selectedDate = value ? new Date(value) : null;

  const lang = i18n.language || "en";
  const baseLang = lang.split("-")[0];

  const localeKey = baseLang === "pl" ? "pl" : baseLang === "es" ? "es" : "en";
  const dateFormat = baseLang === "en" ? "dd/MM/yyyy" : "dd.MM.yyyy";

  const today = new Date();
  today.setHours(0, 0, 0, 0); // żeby nie było problemów z godziną

  return (
    <div className="date-input">
      <DatePicker
        selected={selectedDate}
        onChange={(date) =>
          onChange(date ? date.toISOString().slice(0, 10) : "")
        }
        dateFormat={dateFormat}
        locale={localeKey}
        placeholderText={placeholder}
        customInput={<DateInput id={id} name={name} />}
        calendarClassName="date-input__popup"
        popperClassName="date-input__popper"
        minDate={today} // ⬅️ BLOKADA DAT PRZESZŁYCH
      />
    </div>
  );
}

export default DatePickerField;
