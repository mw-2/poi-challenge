const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;
const HOTSPOT_DATA_FILE = path.join(__dirname, "hotspots.json");

app.use(express.json());
app.use(cors());

// Load hotspot data from file, creating the file if it doesn't exist
const loadHotspotData = () => {
  if (!fs.existsSync(HOTSPOT_DATA_FILE)) {
    fs.writeFileSync(HOTSPOT_DATA_FILE, JSON.stringify({}, null, 2), "utf8");
    return {};
  }
  try {
    const data = fs.readFileSync(HOTSPOT_DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading hotspot data:", error);
    return {};
  }
};

// Save hotspot data to file
const saveHotspotData = (newHotspots) => {
  try {
    fs.writeFileSync(HOTSPOT_DATA_FILE, JSON.stringify(newHotspots, null, 2), "utf8");
    console.log("Hotspots successfully saved.");
  } catch (error) {
    console.error("Error saving hotspot data:", error);
  }
};

// Get hotspots
app.get("/api/hotspots", (req, res) => {
  const data = loadHotspotData();
  res.json(data);
});

// Save hotspots
app.post("/api/hotspots", (req, res) => {
  console.log("Received Data:", req.body);
  if (!req.body || typeof req.body !== 'object') {
    console.error("Invalid or empty hotspot data received.");
    return res.status(400).json({ error: "Invalid or empty hotspot data received." });
  }
  saveHotspotData(req.body);
  res.json({ message: "Hotspots saved successfully", savedData: req.body });
});

// Delete hotspot
app.delete("/api/hotspots/:hotspotName", (req, res) => {
  const hotspotName = req.params.hotspotName;
  const data = loadHotspotData();

  if (data[hotspotName]) {
    delete data[hotspotName];
    saveHotspotData(data);
    res.json({ message: "Hotspot deleted successfully", deletedHotspot: hotspotName });
  } else {
    res.status(404).json({ error: "Hotspot not found" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});