const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
    required: true,
  },
  email: { type: String, required: true },
  amount: Number, // in Naira
  reference: String,
  status: { type: String, default: "pending" },
});

module.exports = mongoose.model("Payment", paymentSchema);
