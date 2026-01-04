const nodemailer = require("nodemailer");

// Konfiguracja transportera pod mSerwis
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mail.elepepes-sanctuary.org", // Zazwyczaj mail.twojadomena.org na mSerwis
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Funkcja wysyłająca powiadomienie o nowym kontakcie
 */
async function sendContactEmail({ name, email, subject, message }) {
  // Wysyłamy Z konta systemowego NA konto systemowe
  const systemEmail = process.env.SMTP_USER;

  const text = `
New message from Contact Form (Elepepe's Sanctuary):

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">New Contact Form Submission</h2>
      <hr style="border: 0; border-top: 1px solid #eee;" />
      
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Subject:</strong> ${subject}</p>
      
      <h3 style="color: #2c3e50;">Message:</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 20px;" />
      <p style="font-size: 12px; color: #7f8c8d;">
        This email was sent from the contact form at elepepes-sanctuary.org.
        <br>Click "Reply" to answer directly to the sender (${email}).
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Elepepe's Form" <${systemEmail}>`, // Nadawca: Twoje konto
    to: systemEmail, // Odbiorca: Twoje konto
    replyTo: email, // WAŻNE: Odpowiedź pójdzie do klienta
    subject: `[Contact Form] ${subject}`, // Temat maila
    text,
    html,
  });
}

module.exports = { sendContactEmail };
