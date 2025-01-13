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
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
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
