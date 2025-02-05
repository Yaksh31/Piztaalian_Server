const mongoose = require("mongoose");

const ContactMasterSchema = new mongoose.Schema(
  {
    name: {
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
    description: {
      type: String,
      required: true,
     
    },
    // You can use this field later if you want to “deactivate” a contact message
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ContactMaster", ContactMasterSchema);
