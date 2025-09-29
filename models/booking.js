const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guestCount: {
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
  },
  price: { type: Number }, // base price without VAT
  vatRate: { type: Number, default: 7.5 },
  totalPrice: Number,
  status: { type: String, default: "pending_payment" },
});

module.exports = mongoose.model("Booking", bookingSchema);
