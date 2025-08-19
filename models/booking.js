const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, required: true },
  price: { type: Number }, // base price without VAT
  vatRate: { type: Number, default: 7.5 },
  totalPrice: Number,
  status: { type: String, default: "pending_payment" },
});

module.exports = mongoose.model("Booking", bookingSchema);
