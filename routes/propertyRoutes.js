const express = require("express");

const {
  getPropertyDetails,
  listProperties,
} = require("../controllers/propertyController"); // ✅ correct file name

const router = express.Router();

router.get("/listProperties", listProperties);   // ✅ cleaner name
router.get("/:id", getPropertyDetails);

module.exports = router;
