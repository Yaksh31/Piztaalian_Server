const mongoose = require("mongoose");
const { Schema, model, Types } = require("mongoose");
const ComplainSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    number: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    message: {
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

module.exports = mongoose.model("Complain", ComplainSchema);
