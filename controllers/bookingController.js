const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Property = require("../models/property");

const checkAvailability = async (req, res) => {
  try {
    const { checkInDate, checkOutDate } = req.body;
    if (!checkInDate || !checkOutDate) {
      return res
        .status(400)
        .json({ error: "CheckInDate and CheckOutDate required" });
    }

    const { propertyId } = req.body;
    const overlapping = await Booking.findOne({
      propertyId,
      checkInDate: { $lt: new Date(checkOutDate) },
      checkOutDate: { $gt: new Date(checkInDate) },
    });

    res.json({ available: !overlapping });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createBooking = async (req, res) => {
  try {
    const {
      propertyId,
      checkInDate,
      checkOutDate,
      guestCount,
      totalPrice: frontendTotalPrice,
    } = req.body;

    // Validate required fields
    if (!propertyId || !checkInDate || !checkOutDate) {
      return res.status(400).json({
        error:
          "Missing required fields: propertyId, CheckInDate, or CheckOutDate",
      });
    }

    // Check if property exists
    const propertyDoc = await Property.findById(propertyId).select(
      "pricePerNight"
    );
    if (!propertyDoc) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Parse dates and validate
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    // Check availability
    const overlapping = await Booking.findOne({
      propertyId,
      checkInDate: { $lt: end },
      checkOutDate: { $gt: start },
    });
    if (overlapping) {
      return res
        .status(409)
        .json({ error: "Property not available for selected dates" });
    }

    // Calculate price
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.ceil((end - start) / msPerDay);
    const basePrice = nights * propertyDoc.pricePerNight;
    const extraCharge = req.body.extraCharge || 0;
    const backendTotalPrice = basePrice + extraCharge;

    // Prefer frontend totalPrice if provided, validate against backend calculation
    const finalTotalPrice = frontendTotalPrice
      ? Math.abs(frontendTotalPrice - backendTotalPrice) < 0.01
        ? frontendTotalPrice
        : backendTotalPrice
      : backendTotalPrice;

    if (finalTotalPrice <= 0) {
      return res.status(400).json({ error: "Total price must be positive" });
    }

    const newBooking = new Booking({
      propertyId,
      checkInDate: start,
      checkOutDate: end,
      guestCount: guestCount || 1,
      totalPrice: finalTotalPrice,
      status: "pending_payment",
    });

    await newBooking.save();
    res.status(201).json({
      ...newBooking.toObject(),
      message: "Booking created successfully",
    });
  } catch (err) {
    console.error("Booking creation error:", err); // Log for debugging
    res
      .status(500)
      .json({ error: "Internal server error", details: err.message });
  }
};

const getBookingDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid booking ID" });
    }

    const bookingDoc = await Booking.findById(id).populate("propertyId");
    if (!bookingDoc) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json(bookingDoc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate("propertyId");
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  checkAvailability,
  createBooking,
  getBookingDetails,
  getAllBookings,
};
