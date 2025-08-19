const express = require("express");
const {
  checkAvailability,
  createBooking,
  getBookingDetails,
  getAllBookings,
} = require("../controllers/bookingController");

const router = express.Router();

router.get("/list", getAllBookings);
router.post("/:productId/check-availability", checkAvailability);
router.get("/:id", getBookingDetails);
router.post("/", createBooking);

module.exports = router;
