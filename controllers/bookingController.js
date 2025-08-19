const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Property = require("../models/property");

const checkAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate required" });
    }

    const overlapping = await Booking.findOne({
      propertyId: req.params.propertyId,
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
    const { propertyId, startDate, endDate, guests } = req.body;

    if (!propertyId || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check product exists
    const propertyDoc = await Property.findById(propertyId);
    if (!propertyDoc) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check availability
    const overlapping = await Booking.findOne({
      propertyId,
      startDate: { $lt: new Date(endDate) },
      endDate: { $gt: new Date(startDate) },
    });
    if (overlapping) {
      return res
        .status(409)
        .json({ error: "Property not available for selected dates" });
    }

    // Calculate price
    const msPerDay = 24 * 60 * 60 * 1000;
    const nights = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / msPerDay
    );
    const totalPrice =
      nights * propertyDoc.pricePerNight + (req.body.extraCharge || 0);

    const newBooking = new Booking({
      userId: req.body.userId || null,
      propertyId,
      startDate,
      endDate,
      guests: guests || 1,
      totalPrice,
      status: "pending_payment",
    });

    await newBooking.save();
    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
