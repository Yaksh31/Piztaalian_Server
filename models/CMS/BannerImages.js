const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const BannerImagesSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
    },
    keyWord: {
      type: String,
      required: true,
    },
    Description: {
      type: String,
      // required: true,
    },
    bannerImage: {
      type: String,
     // required: true,
    },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BannerImages", BannerImagesSchema);
