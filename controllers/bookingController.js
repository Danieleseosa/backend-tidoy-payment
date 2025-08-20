const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Property = require("../models/property");

const checkAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }

    const { propertyId } = req.body;
    const overlapping = await Booking.findOne({
      propertyId,
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
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
      startDate,
      endDate,
      guests,
      totalPrice: frontendTotalPrice,
    } = req.body;

    // Validate required fields
    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({
        error: "Missing required fields: propertyId, startDate, or endDate",
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
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ error: "Invalid date range" });
    }

    // Check availability
    const overlapping = await Booking.findOne({
      propertyId,
      startDate: { $lt: end },
      endDate: { $gt: start },
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
      startDate: start,
      endDate: end,
      guests: guests || 1,
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
