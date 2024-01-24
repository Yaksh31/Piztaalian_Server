//grind type
//is active
//drinkk category master id

const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const GrindCategoryMasterSchema = new mongoose.Schema(
  {
    grindType: {
      type: String,
      required: true,
    },
    drinkCategory: {
      type: Schema.Types.ObjectId,
      ref: "DrinkCategoryMaster",
      required: true,
    },
    IsActive: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "GrindCategoryMaster",
  GrindCategoryMasterSchema
);
