const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  title: String,
  propertyType: String,
  city: String,
  area: String,
  score: Number,
  reviewCount: Number,
  rooms: Number,
  bathrooms: Number,
  size: Number,
  pricePerNight: Number,
  images: [String], // <== Store image paths here
  amenities: [String],
  description: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
});

module.exports = mongoose.model("Property", propertySchema);
