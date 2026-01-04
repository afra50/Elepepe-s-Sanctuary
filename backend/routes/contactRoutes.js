const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../utils/email");

router.post("/", async (req, res) => {
  // Pobieramy dane z body
  const { name, email, phone, subject, message, consent } = req.body || {};

  // 1. Walidacja wymaganych pól
  if (!name || !email || !subject || !message || !consent) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 2. Walidacja telefonu (opcjonalna, ale dobra praktyka)
  // Jeśli telefon jest podany, sprawdzamy format. Jeśli pusty - pomijamy (chyba że jest required na froncie)
  if (phone) {
    const phoneRegex = /^\+?[0-9\s-]{6,20}$/; // Trochę luźniejszy regex (pozwala na spacje i myślniki)
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: "Invalid phone number format" });
    }
  }

  try {
    // Próba wysyłki maila
    await sendContactEmail({
      name,
      email,
      phone: phone || "Not provided",
      subject,
      message,
    });

    // Sukces
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("❌ Email sending error:", err);
    res
      .status(500)
      .json({ error: "Failed to send message. Please try again later." });
  }
});

module.exports = router;
