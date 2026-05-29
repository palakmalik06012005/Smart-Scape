const express = require("express");
const Place = require("../models/Place");

const router = express.Router();

function buildCafeFilters(queryParams) {
  const { search, crowd, ambience, budget } = queryParams;
  const query = { category: "cafes" };

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }
  if (crowd && crowd !== "all") {
    query.crowd = crowd;
  }
  if (ambience && ambience !== "all") {
    query.ambience = ambience;
  }
  if (budget && budget !== "all") {
    query.budget = budget;
  }

  return query;
}

// GET /api/places?category=temples
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const places = await Place.find(query).sort({ name: 1 });
    res.json(places);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch places" });
  }
});

// GET /api/places/cafes?search=kalsang&crowd=moderate&ambience=cozy&budget=medium
router.get("/cafes", async (req, res) => {
  try {
    const query = buildCafeFilters(req.query);
    const cafes = await Place.find(query).sort({ name: 1 });
    res.json(cafes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch cafes" });
  }
});

// GET /api/places/:id
router.get("/:id", async (req, res) => {
  try {
    const place = await Place.findOne({ placeId: req.params.id });
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }
    return res.json(place);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch place details" });
  }
});

// POST /api/places/:id/reviews
router.post("/:id/reviews", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Review text is required" });
    }

    const place = await Place.findOne({ placeId: req.params.id });
    if (!place) {
      return res.status(404).json({ message: "Place not found" });
    }

    place.reviews.push({ text: text.trim() });
    await place.save();

    return res.status(201).json({
      message: "Review added successfully",
      reviews: place.reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to add review" });
  }
});

module.exports = router;
