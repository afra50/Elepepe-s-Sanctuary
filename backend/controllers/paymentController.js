// backend/controllers/paymentController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res, next) => {
  try {
    const { amount, currency, description } = req.body;

    // Walidacja podstawowa
    if (!amount || !currency) {
      return res.status(400).json({ error: "Missing amount or currency" });
    }

    const curr = currency.toLowerCase();

    // 1. BAZA: Karty (obsługuje też Apple Pay, Google Pay, Link)
    // Dodajemy też 'revolut_pay', bo masz go włączonego na liście Wallet
    let paymentMethods = ["card", "revolut_pay"];

    // 2. LOGIKA DLA PLN (Polska)
    if (curr === "pln") {
      paymentMethods.push("blik");
      // Przelewy24 usunięte zgodnie z Twoją prośbą (blokada konta)
    }

    // 3. LOGIKA DLA EUR (Europa)
    if (curr === "eur") {
      // Metody, które widzę jako "Enabled" na Twoim screenie:
      paymentMethods.push("bancontact"); // Belgia
      paymentMethods.push("cartes_bancaires"); // Francja (Cartes Bancaires)

      // UWAGA: Na ostatnim screenie iDEAL i EPS są "Disabled".
      // Jeśli je włączysz w panelu, odkomentuj poniższe linie:
      // paymentMethods.push('ideal');      // Holandia
      // paymentMethods.push('eps');        // Austria
    }

    // 4. Tworzenie sesji
    const session = await stripe.checkout.sessions.create({
      payment_method_types: paymentMethods,
      line_items: [
        {
          price_data: {
            currency: curr,
            product_data: {
              name: description || "Darowizna",
            },
            // Zakładamy, że frontend wysyła kwotę w groszach/centach (np. 5000 dla 50.00)
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // Pamiętaj, aby w .env ustawić CLIENT_URL (np. http://localhost:3000)
      success_url: `${process.env.CLIENT_URL}/donate-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/donate-cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    next(error);
  }
};

module.exports = {
  createCheckoutSession,
};
