const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const bookingRoutes = require("./routes/bookingRoute");
const propertyRoutes = require("./routes/propertyRoutes");
const paymentRoutes = require("./routes/paymentRoute");

const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/booking", bookingRoutes);
app.use("/api/property", propertyRoutes);
app.use("/api/payment", paymentRoutes);

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("Database connected");

    app.listen(port, () => {
      console.log(`Server is running on PORT ${port}`);
    });
  } catch (err) {
    console.error(err);
  }
};

start();
