const fs = require("fs");
const path = require("path");
const vm = require("vm");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const Place = require("./models/Place");

dotenv.config();

function loadPlacesFromDataFile() {
  const dataPath = path.join(__dirname, "..", "data.js");
  const sourceCode = fs.readFileSync(dataPath, "utf8");

  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(`${sourceCode}; this.__PLACES__ = PLACES;`, sandbox);

  if (!sandbox.__PLACES__) {
    throw new Error("Could not read PLACES from data.js");
  }
  return sandbox.__PLACES__;
}

function normalizePlace(category, place) {
  const isCafe = category === "cafes";
  return {
    placeId: place.id,
    category,
    name: place.name || "",
    image: place.image || "",
    description: place.description || "",
    map: place.map || "",
    location: place.location || "",
    timing: place.timing || "",
    rating: isCafe && place.rating ? Number(place.rating) : null,
    crowd: isCafe ? place.crowd || "" : "",
    ambience: isCafe ? place.ambience || "" : "",
    budget: isCafe ? place.budget || "" : "",
    occasion: isCafe ? place.occasion || "" : "",
    menu: isCafe && Array.isArray(place.menu) ? place.menu : [],
    reviews:
      isCafe && Array.isArray(place.reviews)
        ? place.reviews.map((text) => ({ text }))
        : [],
  };
}

async function runSeed() {
  await connectDB();

  const placesObject = loadPlacesFromDataFile();
  const allDocs = [];

  for (const [category, entries] of Object.entries(placesObject)) {
    if (!Array.isArray(entries)) {
      continue;
    }
    entries.forEach((entry) => {
      allDocs.push(normalizePlace(category, entry));
    });
  }

  await Place.deleteMany({});
  await Place.insertMany(allDocs);

  console.log(`Seeded ${allDocs.length} places successfully.`);
  process.exit(0);
}

runSeed().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
