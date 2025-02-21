const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const GallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      // required: true,
    },
    bannerImage: {
      type: String,
      // required: true,
    },
    IsActive: {
      default: true,
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Gallery", GallerySchema);
