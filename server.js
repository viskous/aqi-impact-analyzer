const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, "data", "reports.json");

app.use(express.json({ limit: "6mb" }));
app.use(express.static(__dirname));

async function ensureDb() {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, "[]", "utf8");
  }
}

async function loadReports() {
  await ensureDb();
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function saveReports(reports) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(reports, null, 2), "utf8");
}

async function geocodeLocation(location) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    location
  )}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "aqi-impact-analyzer/1.0 (pollution reporting)"
    }
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status})`);
  }

  const results = await response.json();
  const first = Array.isArray(results) ? results[0] : null;
  if (!first?.lat || !first?.lon) {
    throw new Error("Unable to geocode location. Please be more specific.");
  }

  return {
    latitude: Number(first.lat),
    longitude: Number(first.lon),
    displayName: first.display_name || location
  };
}

app.get("/api/reports", async (_req, res) => {
  const reports = await loadReports();
  reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(reports);
});

app.post("/api/reports", async (req, res) => {
  try {
    const location = String(req.body?.location || "").trim();
    const pollutionType = String(req.body?.pollutionType || "").trim();
    const description = String(req.body?.description || "").trim();
    const imageEvidence = typeof req.body?.imageEvidence === "string" ? req.body.imageEvidence : null;

    if (!location || !pollutionType || !description) {
      return res.status(400).json({ error: "Location, pollution type, and description are required." });
    }

    const geo = await geocodeLocation(location);
    const report = {
      id: crypto.randomUUID(),
      location,
      locationLabel: geo.displayName,
      pollutionType,
      description,
      imageEvidence,
      coordinates: {
        latitude: geo.latitude,
        longitude: geo.longitude
      },
      timestamp: new Date().toISOString()
    };

    const reports = await loadReports();
    reports.push(report);
    await saveReports(reports);

    return res.status(201).json(report);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Failed to submit report."
    });
  }
});

app.listen(PORT, () => {
  console.log(`AQI Impact server running at http://localhost:${PORT}`);
});
