const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

// Model
const Restaurant = require(path.join(__dirname, "models", "restaurant"));

const app = express();

// CORS + JSON (increase body limit for base64 images)
app.use(cors());
app.use(express.json({ limit: "25mb" }));

// Simple request logger
app.use((req, _res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ` +
      `(content-length=${req.headers["content-length"] || "n/a"})`
  );
  next();
});

// Connect to MongoDB (db: cravory)
const MONGO_URI = "mongodb+srv://admin:admin@cluster0.w01or65.mongodb.net/";
mongoose
  .connect(MONGO_URI, { dbName: "cravory" })
  .then(() => console.log("MongoDB connected (db: cravory)"))
  .catch((err) => {
    console.error("MongoDB connection error", err);
    process.exit(1);
  });

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Handle preflight explicitly (optional; cors() already handles this)
app.options("/api/restaurants", cors());

// Create or update restaurant (upsert by name)
app.post("/api/restaurants", async (req, res, next) => {
  try {
    const { name, mapLink, dishes, restaurantImage, dishImage } = req.body || {};
    console.log("Create/Update request:", {
      name,
      hasMapLink: !!mapLink,
      dishesLen: dishes ? String(dishes).length : 0,
      restaurantImageLen: restaurantImage ? String(restaurantImage).length : 0,
      dishImageLen: dishImage ? String(dishImage).length : 0,
    });

    if (!name || !mapLink || !dishes || !restaurantImage || !dishImage) {
      console.warn("Validation failed: missing required fields");
      return res.status(400).json({ error: "All fields are required." });
    }

    const toArray = (s) =>
      String(s)
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    const existing = await Restaurant.findOne({ name });
    if (existing) {
      // merge dishes (unique, case-insensitive)
      const current = toArray(existing.dishes);
      const incoming = toArray(dishes);
      const seen = new Map();
      for (const d of current) seen.set(d.toLowerCase(), d);
      for (const d of incoming) seen.set(d.toLowerCase(), d);
      const merged = Array.from(seen.values()).join(", ");

      existing.mapLink = mapLink;
      existing.dishes = merged;
      existing.restaurantImage = restaurantImage;
      existing.dishImage = dishImage;

      await existing.save();
      console.log("Updated restaurant:", existing._id.toString());
      return res.status(200).json({ id: existing._id, updated: true });
    } else {
      const doc = await Restaurant.create({
        name,
        mapLink,
        dishes,
        restaurantImage,
        dishImage,
      });
      console.log("Created restaurant:", doc._id.toString());
      return res.status(201).json({ id: doc._id, updated: false });
    }
  } catch (e) {
    console.error("POST /api/restaurants error:", e && (e.stack || e.message || e));
    next(e);
  }
});

// List restaurants
app.get("/api/restaurants", async (_req, res, next) => {
  try {
    const items = await Restaurant.find().sort({ _id: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error("GET /api/restaurants error:", e && (e.stack || e.message || e));
    next(e);
  }
});

// Global error handler (including JSON body parsing errors)
app.use((err, _req, res, _next) => {
  if (err && err.type === "entity.too.large") {
    console.error("Payload too large:", err.message);
    return res.status(413).json({ error: "Payload too large" });
  }
  console.error("Unhandled error:", err && (err.stack || err.message || err));
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
