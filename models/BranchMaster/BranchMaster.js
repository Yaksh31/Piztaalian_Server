const mongoose = require("mongoose");

const BranchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: true,
      unique:true,
    },
    isActive: {
      type: Boolean,
      default: true, // Default value for new branches
    },
    address: {
      type: String,
      required: true,
    },
    area: {
      type: String,
      required: true,
    },
    city: {
      type: mongoose.Schema.Types.ObjectId, // Reference to City collection
      ref: "City",
      required: true,
    },
    state: {
      type: mongoose.Schema.Types.ObjectId, // Reference to State collection
      ref: "State",
      required: true,
    },
    country: {
      type: mongoose.Schema.Types.ObjectId, // Reference to Country collection
      ref: "Country",
      required: true,
    },
    phone: {
      type: String,
      required: true,
      
    },
    email: {
      type: String,
      required: true,
      
    },
    
    password: {
      type: String,
      required: true,
     
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Branches", BranchSchema);
