const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const OfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },

    bannerImage: {
      type: String,
    },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offers", OfferSchema);
