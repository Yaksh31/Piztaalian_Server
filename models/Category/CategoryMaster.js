//category name
//is active


const mongoose = require("mongoose");

const CategoryMasterSchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      unique: true, // Ensures categoryName is unique
      required: true, // Optional: Ensures categoryName is always provided
      
    },
    IsActive: {
      type: Boolean,
      default: true, // Optional: Sets default value for IsActive
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CategoryMaster", CategoryMasterSchema);

