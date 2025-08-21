require("dotenv").config();
console.log("PAYSTACK_SECRET_KEY =>", process.env.PAYSTACK_SECRET_KEY);

// controllers/paystackController.js
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const paystack = require("paystack-api")(process.env.PAYSTACK_SECRET_KEY);

// Initialize Payment
const initializePayment = async (req, res) => {
  try {
    const { bookingId, email, amount } = req.body;

    if (!bookingId || !email || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Paystack requires amount in KOBO (₦500 = 50000)
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount, // already in kobo from frontend
          metadata: { bookingId },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(" Paystack init error:", data);
      return res
        .status(500)
        .json({ error: "Payment initialization failed", details: data });
    }

    return res.json({
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (err) {
    console.error("🔥 Paystack init error:", err.response?.data || err.message);
    return res.status(500).json({ error: "Payment initialization failed" });
  }
};

// Verify Payment
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.query;

    const verification = await paystack.transaction.verify({ reference });

    if (verification.data.status === "success") {
      await Payment.findOneAndUpdate({ reference }, { status: "paid" });

      // Update booking status too
      await Booking.findByIdAndUpdate(verification.data.metadata?.bookingId, {
        status: "paid",
      });

      return res.json({
        message: "Payment successful",
        data: verification.data,
      });
    }

    res
      .status(400)
      .json({ message: "Payment failed", data: verification.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { initializePayment, verifyPayment };
