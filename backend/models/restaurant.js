const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mapLink: { type: String, required: true },
    dishes: { type: String, required: true }, // comma-separated string
    restaurantImage: { type: String, required: true }, // data URI base64
    dishImage: { type: String, required: true }, // data URI base64
  },
  { timestamps: true, collection: "cravory-collection" }
);

module.exports = mongoose.models.Restaurant || mongoose.model("Restaurant", RestaurantSchema);
