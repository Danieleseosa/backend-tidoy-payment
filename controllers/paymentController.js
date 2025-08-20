require("dotenv").config();
console.log("PAYSTACK_SECRET_KEY =>", process.env.PAYSTACK_SECRET_KEY);

// controllers/paystackController.js
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const paystack = require("paystack-api")(process.env.PAYSTACK_SECRET_KEY);

// Initialize Payment
const initializePayment = async (req, res) => {
  try {
    const { bookingId, email } = req.body;

    if (!bookingId || !email || !amount) {
      return res
        .status(400)
        .json({ error: "bookingId, email, and amount are required" });
    }

    // Find the property in DB
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    // Convert to kobo (Paystack works with kobo)
    const amountInKobo = booking.totalPrice * 100;

    // Initialize payment with Paystack
    const paymentInit = await paystack.transaction.initialize({
      email,
      amount: amountInKobo,
      reference: `BOOK_${booking._id}_${Date.now()}`,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      metadata: { bookingId: booking._id.toString() }, // <-- add this
    });

    // Save payment record
    await Payment.create({
      bookingId,
      email,
      amount: booking.totalPrice,
      reference: paymentInit.data.reference,
      status: "pending",
    });

    res.json({
      authorizationUrl: paymentInit.data.authorization_url,
      reference: paymentInit.data.reference,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
