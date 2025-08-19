const Property = require("../models/property");

const getPropertyDetails = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "property not found" });
    res.json({ property });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const listProperties = async (req, res) => {
  try {
    const properties = await Property.find();
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getPropertyDetails, listProperties };
